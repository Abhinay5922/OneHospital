/**
 * Referral Controller
 * Handles doctor-to-doctor patient referrals
 */

const mongoose = require('mongoose');
const Referral = require('../models/Referral');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');

// Create new referral
const createReferral = async (req, res) => {
  try {
    const {
      patientId,
      referredToDoctorId,
      originalAppointmentId,
      referralReason,
      patientCondition,
      symptoms,
      currentTreatment,
      medications,
      testResults,
      urgencyLevel,
      specialtyRequired,
      preferredAppointmentDate,
      expectedDuration,
      additionalNotes,
      followUpRequired,
      followUpInstructions
    } = req.body;

    const referringDoctorId = req.user.userId;

    // Validate referring doctor
    const referringDoctor = await User.findById(referringDoctorId);
    if (!referringDoctor || referringDoctor.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can create referrals'
      });
    }

    // Validate referred to doctor
    const referredToDoctor = await User.findById(referredToDoctorId);
    if (!referredToDoctor || referredToDoctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid referred to doctor'
      });
    }

    // Validate patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient'
      });
    }

    // Validate original appointment
    const originalAppointment = await Appointment.findById(originalAppointmentId);
    if (!originalAppointment || originalAppointment.doctorId.toString() !== referringDoctorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment or unauthorized access'
      });
    }

    // Create referral
    const referral = new Referral({
      patientId,
      referringDoctorId,
      referredToDoctorId,
      referringHospitalId: referringDoctor.hospitalId,
      referredToHospitalId: referredToDoctor.hospitalId,
      originalAppointmentId,
      referralReason,
      patientCondition,
      symptoms,
      currentTreatment,
      medications: medications || [],
      testResults: testResults || [],
      urgencyLevel: urgencyLevel || 'routine',
      specialtyRequired,
      preferredAppointmentDate,
      expectedDuration,
      additionalNotes,
      followUpRequired: followUpRequired || false,
      followUpInstructions
    });

    await referral.save();

    // Populate the referral for response
    const populatedReferral = await Referral.findById(referral._id)
      .populate('patientId', 'firstName lastName email phone')
      .populate('referringDoctorId', 'firstName lastName doctorInfo.specialization')
      .populate('referredToDoctorId', 'firstName lastName doctorInfo.specialization')
      .populate('referringHospitalId', 'name')
      .populate('referredToHospitalId', 'name');

    // Send real-time notification to referred doctor
    if (req.io) {
      req.io.to(`doctor-${referredToDoctorId}`).emit('new-referral', {
        referral: populatedReferral,
        message: `New referral from Dr. ${referringDoctor.firstName} ${referringDoctor.lastName}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Referral created successfully',
      data: { referral: populatedReferral }
    });

  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create referral',
      error: error.message
    });
  }
};

// Get referrals sent by doctor
const getSentReferrals = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    let query = { referringDoctorId: doctorId };
    if (status) {
      query.status = status;
    }

    const referrals = await Referral.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('referredToDoctorId', 'firstName lastName doctorInfo.specialization')
      .populate('referredToHospitalId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Referral.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        referrals,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching sent referrals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent referrals',
      error: error.message
    });
  }
};

// Get referrals received by doctor
const getReceivedReferrals = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    let query = { referredToDoctorId: doctorId };
    if (status) {
      query.status = status;
    }

    const referrals = await Referral.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('referringDoctorId', 'firstName lastName doctorInfo.specialization')
      .populate('referringHospitalId', 'name')
      .sort({ urgencyLevel: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Referral.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        referrals,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching received referrals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch received referrals',
      error: error.message
    });
  }
};

// Get referral by ID
const getReferralById = async (req, res) => {
  try {
    const { referralId } = req.params;
    const doctorId = req.user.userId;

    const referral = await Referral.findById(referralId)
      .populate('patientId', 'firstName lastName email phone patientInfo')
      .populate('referringDoctorId', 'firstName lastName doctorInfo.specialization')
      .populate('referredToDoctorId', 'firstName lastName doctorInfo.specialization')
      .populate('referringHospitalId', 'name address')
      .populate('referredToHospitalId', 'name address')
      .populate('originalAppointmentId');

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    // Check if doctor has access to this referral
    if (referral.referringDoctorId._id.toString() !== doctorId && 
        referral.referredToDoctorId._id.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to referral'
      });
    }

    res.status(200).json({
      success: true,
      data: { referral }
    });

  } catch (error) {
    console.error('Error fetching referral:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral',
      error: error.message
    });
  }
};

// Respond to referral (accept/decline)
const respondToReferral = async (req, res) => {
  try {
    const { referralId } = req.params;
    const { status, responseNotes } = req.body;
    const doctorId = req.user.userId;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be accepted or declined'
      });
    }

    const referral = await Referral.findById(referralId);
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    // Check if doctor is the referred to doctor
    if (referral.referredToDoctorId.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to respond to this referral'
      });
    }

    // Update referral
    referral.status = status;
    referral.responseDate = new Date();
    referral.responseNotes = responseNotes;

    await referral.save();

    // Populate for response
    const populatedReferral = await Referral.findById(referral._id)
      .populate('patientId', 'firstName lastName')
      .populate('referringDoctorId', 'firstName lastName')
      .populate('referredToDoctorId', 'firstName lastName');

    // Send notification to referring doctor
    if (req.io) {
      req.io.to(`doctor-${referral.referringDoctorId}`).emit('referral-response', {
        referral: populatedReferral,
        message: `Dr. ${populatedReferral.referredToDoctorId.firstName} ${populatedReferral.referredToDoctorId.lastName} ${status} your referral`
      });
    }

    res.status(200).json({
      success: true,
      message: `Referral ${status} successfully`,
      data: { referral: populatedReferral }
    });

  } catch (error) {
    console.error('Error responding to referral:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to referral',
      error: error.message
    });
  }
};

// Get available doctors for referral
const getAvailableDoctors = async (req, res) => {
  try {
    const { specialty, hospitalId } = req.query;
    const currentDoctorId = req.user.userId;

    let query = { 
      role: 'doctor', 
      isActive: true,
      _id: { $ne: currentDoctorId } // Exclude current doctor
    };

    if (specialty) {
      query['doctorInfo.specialization'] = specialty;
    }

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    const doctors = await User.find(query)
      .select('firstName lastName doctorInfo.specialization doctorInfo.experience hospitalId')
      .populate('hospitalId', 'name address.city address.state')
      .sort({ 'doctorInfo.specialization': 1, firstName: 1 });

    res.status(200).json({
      success: true,
      data: { doctors }
    });

  } catch (error) {
    console.error('Error fetching available doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available doctors',
      error: error.message
    });
  }
};

// Get referral statistics
const getReferralStats = async (req, res) => {
  try {
    const doctorId = req.user.userId;

    const [sentStats, receivedStats] = await Promise.all([
      Referral.aggregate([
        { $match: { referringDoctorId: mongoose.Types.ObjectId(doctorId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Referral.aggregate([
        { $match: { referredToDoctorId: mongoose.Types.ObjectId(doctorId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const formatStats = (stats) => {
      const result = { pending: 0, accepted: 0, declined: 0, completed: 0, cancelled: 0 };
      stats.forEach(stat => {
        result[stat._id] = stat.count;
      });
      return result;
    };

    res.status(200).json({
      success: true,
      data: {
        sent: formatStats(sentStats),
        received: formatStats(receivedStats)
      }
    });

  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral statistics',
      error: error.message
    });
  }
};

module.exports = {
  createReferral,
  getSentReferrals,
  getReceivedReferrals,
  getReferralById,
  respondToReferral,
  getAvailableDoctors,
  getReferralStats
};