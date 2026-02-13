/**
 * Emergency Controller
 * Handles emergency video call requests and management
 */

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const EmergencyCall = require('../models/EmergencyCall');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

// Request emergency consultation
const requestEmergencyCall = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      urgencyLevel,
      symptoms,
      patientLocation
    } = req.body;

    // Check if patient already has an active emergency call
    const activeCall = await EmergencyCall.findOne({
      patientId: req.user._id,
      status: { $in: ['pending', 'connecting', 'active'] }
    });

    if (activeCall) {
      // Check if the active call is old (more than 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      if (activeCall.createdAt < thirtyMinutesAgo) {
        // Auto-cancel old stuck calls
        console.log(`Auto-cancelling old emergency call: ${activeCall.callId}`);
        await EmergencyCall.findByIdAndUpdate(activeCall._id, {
          status: 'timeout',
          callEndTime: new Date()
        });
        
        // Continue with creating new call
        console.log('Old call cancelled, allowing new emergency call creation');
      } else {
        // Return error with more helpful information
        return res.status(400).json({
          success: false,
          message: 'You already have an active emergency call',
          data: { 
            callId: activeCall.callId,
            status: activeCall.status,
            createdAt: activeCall.createdAt,
            canRetry: false
          }
        });
      }
    }

    // Create emergency call request
    const emergencyCall = await EmergencyCall.create({
      patientId: req.user._id,
      urgencyLevel,
      symptoms,
      patientLocation
    });

    // Populate patient data
    await emergencyCall.populate('patientId', 'firstName lastName phone patientInfo');

    // Find available doctors for emergency calls
    const availableDoctors = await User.find({
      role: 'doctor',
      isActive: true,
      'doctorInfo.isAvailable': true,
      'doctorInfo.emergencyAvailable': true
    }).populate('hospitalId', 'name address');

    // Emit emergency call request to all available doctors
    if (req.io) {
      req.io.emit('emergency-call-request', {
        callId: emergencyCall.callId,
        call: emergencyCall,
        availableDoctors: availableDoctors.length,
        message: `Emergency call request - ${urgencyLevel} urgency`
      });

      // Send to specific doctors
      availableDoctors.forEach(doctor => {
        req.io.to(`doctor-${doctor._id}`).emit('emergency-call-available', {
          callId: emergencyCall.callId,
          call: emergencyCall,
          message: 'Emergency consultation available'
        });
      });
    }

    res.status(201).json({
      success: true,
      message: 'Emergency call request created. Searching for available doctors...',
      data: {
        callId: emergencyCall.callId,
        call: emergencyCall,
        availableDoctors: availableDoctors.length
      }
    });

  } catch (error) {
    console.error('Request emergency call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request emergency call',
      error: error.message
    });
  }
};

// Doctor accepts emergency call
const acceptEmergencyCall = async (req, res) => {
  try {
    const { callId } = req.params;

    const emergencyCall = await EmergencyCall.findOne({
      callId,
      status: 'pending'
    }).populate('patientId', 'firstName lastName phone');

    if (!emergencyCall) {
      return res.status(404).json({
        success: false,
        message: 'Emergency call not found or already accepted'
      });
    }

    // Check if doctor is available for emergency calls
    const doctor = await User.findById(req.user._id);
    if (!doctor.doctorInfo?.emergencyAvailable) {
      return res.status(400).json({
        success: false,
        message: 'You are not available for emergency calls'
      });
    }

    // Update call with doctor info
    emergencyCall.doctorId = req.user._id;
    emergencyCall.hospitalId = req.user.hospitalId;
    emergencyCall.status = 'connecting';
    emergencyCall.callStartTime = new Date();

    await emergencyCall.save();
    await emergencyCall.populate('doctorId', 'firstName lastName doctorInfo');
    await emergencyCall.populate('hospitalId', 'name address phone');

    // Notify patient that doctor accepted
    if (req.io) {
      req.io.to(`patient-${emergencyCall.patientId._id}`).emit('emergency-call-accepted', {
        callId: emergencyCall.callId,
        call: emergencyCall,
        doctor: {
          name: `Dr. ${req.user.firstName} ${req.user.lastName}`,
          specialization: req.user.doctorInfo?.specialization,
          hospital: emergencyCall.hospitalId?.name
        },
        message: 'Doctor accepted your emergency call'
      });

      // Notify other doctors that call was taken
      req.io.emit('emergency-call-taken', {
        callId: emergencyCall.callId,
        message: 'Emergency call was accepted by another doctor'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency call accepted successfully',
      data: { call: emergencyCall }
    });

  } catch (error) {
    console.error('Accept emergency call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept emergency call',
      error: error.message
    });
  }
};

// Start video call
const startVideoCall = async (req, res) => {
  try {
    const { callId } = req.params;

    const emergencyCall = await EmergencyCall.findOne({ callId })
      .populate('patientId', 'firstName lastName phone')
      .populate('doctorId', 'firstName lastName doctorInfo')
      .populate('hospitalId', 'name address phone');

    if (!emergencyCall) {
      return res.status(404).json({
        success: false,
        message: 'Emergency call not found'
      });
    }

    // Check if user is part of this call
    const userId = req.user._id.toString();
    if (userId !== emergencyCall.patientId._id.toString() && 
        userId !== emergencyCall.doctorId?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this call'
      });
    }

    // Update call status to active
    if (emergencyCall.status === 'connecting') {
      emergencyCall.status = 'active';
      await emergencyCall.save();

      // Notify both parties that call is now active
      if (req.io) {
        req.io.to(`patient-${emergencyCall.patientId._id}`).emit('video-call-started', {
          callId: emergencyCall.callId,
          message: 'Video call started'
        });

        req.io.to(`doctor-${emergencyCall.doctorId._id}`).emit('video-call-started', {
          callId: emergencyCall.callId,
          message: 'Video call started'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Video call started',
      data: { call: emergencyCall }
    });

  } catch (error) {
    console.error('Start video call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start video call',
      error: error.message
    });
  }
};

// End emergency call
const endEmergencyCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { doctorNotes, firstAidInstructions, followUpRequired, followUpNotes } = req.body;

    const emergencyCall = await EmergencyCall.findOne({ callId });

    if (!emergencyCall) {
      return res.status(404).json({
        success: false,
        message: 'Emergency call not found'
      });
    }

    // Only doctor or patient can end the call
    const userId = req.user._id.toString();
    if (userId !== emergencyCall.patientId.toString() && 
        userId !== emergencyCall.doctorId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to end this call'
      });
    }

    // Update call details if provided by doctor
    if (req.user.role === 'doctor') {
      if (doctorNotes) emergencyCall.doctorNotes = doctorNotes;
      if (followUpRequired !== undefined) emergencyCall.followUpRequired = followUpRequired;
      if (followUpNotes) emergencyCall.followUpNotes = followUpNotes;
      
      // Add first aid instructions
      if (firstAidInstructions && Array.isArray(firstAidInstructions)) {
        firstAidInstructions.forEach(instruction => {
          emergencyCall.firstAidInstructions.push({
            instruction,
            timestamp: new Date()
          });
        });
      }
    }

    // End the call
    await emergencyCall.endCall();

    // Notify both parties
    if (req.io) {
      req.io.to(`patient-${emergencyCall.patientId}`).emit('emergency-call-ended', {
        callId: emergencyCall.callId,
        call: emergencyCall,
        message: 'Emergency call ended'
      });

      if (emergencyCall.doctorId) {
        req.io.to(`doctor-${emergencyCall.doctorId}`).emit('emergency-call-ended', {
          callId: emergencyCall.callId,
          call: emergencyCall,
          message: 'Emergency call ended'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Emergency call ended successfully',
      data: { call: emergencyCall }
    });

  } catch (error) {
    console.error('End emergency call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end emergency call',
      error: error.message
    });
  }
};

// Get emergency call details
const getEmergencyCall = async (req, res) => {
  try {
    const { callId } = req.params;

    const emergencyCall = await EmergencyCall.findOne({ callId })
      .populate('patientId', 'firstName lastName phone patientInfo')
      .populate('doctorId', 'firstName lastName doctorInfo')
      .populate('hospitalId', 'name address phone');

    if (!emergencyCall) {
      return res.status(404).json({
        success: false,
        message: 'Emergency call not found'
      });
    }

    // Check authorization
    const userId = req.user._id.toString();
    if (userId !== emergencyCall.patientId._id.toString() && 
        userId !== emergencyCall.doctorId?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this call'
      });
    }

    res.status(200).json({
      success: true,
      data: { call: emergencyCall }
    });

  } catch (error) {
    console.error('Get emergency call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency call',
      error: error.message
    });
  }
};

// Get patient's emergency call history
const getPatientEmergencyCalls = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const calls = await EmergencyCall.find({
      patientId: req.user._id
    })
    .populate('doctorId', 'firstName lastName doctorInfo')
    .populate('hospitalId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await EmergencyCall.countDocuments({
      patientId: req.user._id
    });

    res.status(200).json({
      success: true,
      data: {
        calls,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get patient emergency calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency calls',
      error: error.message
    });
  }
};

// Get doctor's emergency call history
const getDoctorEmergencyCalls = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { doctorId: req.user._id };
    if (status) query.status = status;

    const calls = await EmergencyCall.find(query)
      .populate('patientId', 'firstName lastName phone')
      .populate('hospitalId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmergencyCall.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        calls,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get doctor emergency calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency calls',
      error: error.message
    });
  }
};

// Add chat message to emergency call
const addChatMessage = async (req, res) => {
  try {
    const { callId } = req.params;
    const { message } = req.body;

    const emergencyCall = await EmergencyCall.findOne({ callId });

    if (!emergencyCall) {
      return res.status(404).json({
        success: false,
        message: 'Emergency call not found'
      });
    }

    // Check authorization
    const userId = req.user._id.toString();
    if (userId !== emergencyCall.patientId.toString() && 
        userId !== emergencyCall.doctorId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this call'
      });
    }

    const sender = req.user.role === 'doctor' ? 'doctor' : 'patient';
    await emergencyCall.addChatMessage(sender, message);

    // Emit message to other party
    const targetUserId = sender === 'doctor' ? emergencyCall.patientId : emergencyCall.doctorId;
    if (req.io && targetUserId) {
      req.io.to(`${sender === 'doctor' ? 'patient' : 'doctor'}-${targetUserId}`).emit('emergency-chat-message', {
        callId: emergencyCall.callId,
        sender,
        message,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Add chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Toggle doctor emergency availability
const toggleEmergencyAvailability = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { available } = req.body;

    // Validate that available is a boolean
    if (typeof available !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Available must be a boolean value (true or false)'
      });
    }

    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can toggle emergency availability'
      });
    }

    // Update the user's emergency availability
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 'doctorInfo.emergencyAvailable': available },
      { new: true, runValidators: true }
    ).select('doctorInfo.emergencyAvailable');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    console.log(`Doctor ${req.user._id} emergency availability updated to: ${available}`);

    res.status(200).json({
      success: true,
      message: `Emergency availability ${available ? 'enabled' : 'disabled'}`,
      data: { emergencyAvailable: available }
    });

  } catch (error) {
    console.error('Toggle emergency availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency availability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  requestEmergencyCall,
  acceptEmergencyCall,
  startVideoCall,
  endEmergencyCall,
  getEmergencyCall,
  getPatientEmergencyCalls,
  getDoctorEmergencyCalls,
  addChatMessage,
  toggleEmergencyAvailability
};