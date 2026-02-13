/**
 * Appointment Controller
 * Handles appointment booking, management, and queue operations
 */

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

// Book new appointment
const bookAppointment = async (req, res) => {
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
      hospitalId,
      doctorId,
      appointmentDate,
      appointmentTime,
      patientDetails
    } = req.body;

    console.log('Booking appointment with data:', {
      hospitalId,
      doctorId,
      appointmentDate,
      appointmentTime,
      patientDetails,
      patientId: req.user._id
    });

    // Verify doctor belongs to hospital
    const doctor = await User.findOne({
      _id: doctorId,
      hospitalId: hospitalId,
      role: 'doctor',
      isActive: true
    });

    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor not found in the specified hospital'
      });
    }

    // Parse appointment date properly
    const appointmentDateTime = new Date(appointmentDate);
    if (isNaN(appointmentDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date format'
      });
    }

    // Check if appointment date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDateTime < today) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past'
      });
    }

    // Check if doctor is available on the requested date/time (simplified check)
    const dayOfWeek = appointmentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
    
    let isAvailable = true; // Temporarily always available for testing
    // if (doctor.doctorInfo && doctor.doctorInfo.availableSlots && doctor.doctorInfo.availableSlots.length > 0) {
    //   isAvailable = doctor.doctorInfo.availableSlots.some(slot => 
    //     slot.day === dayOfWeek && 
    //     appointmentTime >= slot.startTime && 
    //     appointmentTime <= slot.endTime
    //   );
    // }

    // if (!isAvailable) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Doctor is not available at the requested time'
    //   });
    // }

    // Check for existing appointment at the same time for the same patient
    // Allow multiple appointments per day but with 20-minute intervals
    
    // Helper function to convert time string to minutes
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const existingAppointment = await Appointment.findOne({
      patientId: req.user._id,
      doctorId: doctorId,
      appointmentDate: {
        $gte: new Date(appointmentDate).setHours(0, 0, 0, 0),
        $lt: new Date(appointmentDate).setHours(23, 59, 59, 999)
      },
      status: { $in: ['confirmed', 'in_progress'] }
    });

    if (existingAppointment) {
      // Check if the new appointment time conflicts with existing appointment (within 20 minutes)
      const existingTime = existingAppointment.appointmentTime;
      const newTime = appointmentTime;
      
      const existingMinutes = timeToMinutes(existingTime);
      const newMinutes = timeToMinutes(newTime);
      const timeDifference = Math.abs(newMinutes - existingMinutes);
      
      if (timeDifference < 20) {
        return res.status(400).json({
          success: false,
          message: `You already have an appointment with this doctor at ${existingTime}. Please choose a time at least 20 minutes apart.`,
          data: {
            existingAppointment: {
              time: existingTime,
              id: existingAppointment._id
            },
            minimumGap: 20,
            suggestedTimes: [
              // Suggest times 20 minutes before and after
              `${Math.floor((existingMinutes - 20) / 60).toString().padStart(2, '0')}:${((existingMinutes - 20) % 60).toString().padStart(2, '0')}`,
              `${Math.floor((existingMinutes + 20) / 60).toString().padStart(2, '0')}:${((existingMinutes + 20) % 60).toString().padStart(2, '0')}`
            ].filter(time => {
              const [h, m] = time.split(':').map(Number);
              return h >= 9 && h <= 17 && h * 60 + m > 0; // Only suggest times between 9 AM and 5 PM
            })
          }
        });
      }
    }

    // Check for conflicting appointments with the same doctor at the same time
    const conflictingAppointment = await Appointment.findOne({
      doctorId: doctorId,
      appointmentDate: {
        $gte: new Date(appointmentDate).setHours(0, 0, 0, 0),
        $lt: new Date(appointmentDate).setHours(23, 59, 59, 999)
      },
      appointmentTime: appointmentTime,
      status: { $in: ['confirmed', 'in_progress'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please choose a different time.',
        data: {
          conflictingTime: appointmentTime,
          suggestedTimes: [
            // Suggest next available 20-minute slots
            `${Math.floor((timeToMinutes(appointmentTime) + 20) / 60).toString().padStart(2, '0')}:${((timeToMinutes(appointmentTime) + 20) % 60).toString().padStart(2, '0')}`,
            `${Math.floor((timeToMinutes(appointmentTime) + 40) / 60).toString().padStart(2, '0')}:${((timeToMinutes(appointmentTime) + 40) % 60).toString().padStart(2, '0')}`,
            `${Math.floor((timeToMinutes(appointmentTime) + 60) / 60).toString().padStart(2, '0')}:${((timeToMinutes(appointmentTime) + 60) % 60).toString().padStart(2, '0')}`
          ].filter(time => {
            const [h, m] = time.split(':').map(Number);
            return h >= 9 && h <= 17; // Only suggest times between 9 AM and 5 PM
          })
        }
      });
    }

    // Prepare appointment data
    const appointmentData = {
      patientId: req.user._id,
      hospitalId,
      doctorId,
      appointmentDate: appointmentDateTime,
      appointmentTime,
      patientDetails: {
        symptoms: patientDetails.symptoms || '',
        urgency: patientDetails.urgency || 'medium',
        notes: patientDetails.notes || ''
      },
      consultationFee: doctor.doctorInfo?.consultationFee || 500
    };

    console.log('Creating appointment with data:', appointmentData);

    // Create appointment (tokenNumber will be auto-generated by pre-save middleware)
    const appointment = await Appointment.create(appointmentData);

    console.log('Appointment created:', appointment);

    // Calculate estimated wait time
    await appointment.calculateWaitTime();

    // Populate appointment data
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('hospitalId', 'name address phone')
      .populate('doctorId', 'firstName lastName doctorInfo')
      .populate('patientId', 'firstName lastName phone');

    // Emit real-time update
    if (req.io) {
      console.log('Emitting new-appointment event to hospital:', hospitalId, 'and doctor:', doctorId);
        console.log('🔔 BOOKING: Creating socket emissions...');
        console.log('   Hospital room: hospital-' + hospitalId);
        console.log('   Doctor room: doctor-' + doctorId);
      
      req.io.to(`hospital-${hospitalId}`).emit('new-appointment', {
        appointment: populatedAppointment,
        message: 'New appointment booked'
      });
      console.log('   ✅ Emitted to hospital room');
      
      req.io.to(`doctor-${doctorId}`).emit('new-appointment', {
        appointment: populatedAppointment,
        message: 'New appointment in your queue'
      });
      console.log('   ✅ Emitted to doctor room');
      
      // Emit queue update
      req.io.to(`hospital-${hospitalId}`).emit('queue-updated', {
        message: 'Queue updated',
        appointmentId: appointment._id
      });
      console.log('   ✅ Emitted queue-updated to hospital room');
      console.log('New appointment socket events emitted successfully');
    } else {
      console.warn('Socket.IO not available for new appointment events');
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment: populatedAppointment }
    });

  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message
    });
  }
};

// Get patient appointments
const getPatientAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const patientId = req.user._id;

    let query = { patientId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate('hospitalId', 'name address phone')
      .populate('doctorId', 'firstName lastName doctorInfo')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

// Get doctor appointments
const getDoctorAppointments = async (req, res) => {
  try {
    const { date, status } = req.query;
    const doctorId = req.user._id;

    console.log('Getting appointments for doctor:', doctorId, 'date:', date);

    let query = { doctorId };

    if (date) {
      const appointmentDate = new Date(date);
      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.appointmentDate = {
        $gte: startOfDay,
        $lt: endOfDay
      };
    } else {
      // Default to today
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.appointmentDate = {
        $gte: startOfDay,
        $lt: endOfDay
      };
    }

    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName phone patientInfo')
      .populate('hospitalId', 'name')
      .sort({ tokenNumber: 1 });

    console.log('Found', appointments.length, 'appointments for doctor', doctorId);

    res.status(200).json({
      success: true,
      data: { appointments }
    });

  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, doctorNotes } = req.body;

    console.log('🔄 Update appointment status request:', {
      appointmentId,
      status,
      doctorNotes,
      userId: req.user._id,
      userRole: req.user.role
    });

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName')
      .populate('hospitalId', 'name');

    if (!appointment) {
      console.log('❌ Appointment not found:', appointmentId);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    console.log('📋 Found appointment:', {
      id: appointment._id,
      currentStatus: appointment.status,
      newStatus: status,
      patient: `${appointment.patientId?.firstName} ${appointment.patientId?.lastName}`,
      doctor: `${appointment.doctorId?.firstName} ${appointment.doctorId?.lastName}`
    });

    // Update appointment status
    await appointment.updateStatus(status, { doctorNotes });

    console.log('✅ Appointment status updated successfully from', appointment.status, 'to', status);

    // Emit real-time update
    if (req.io) {
      const hospitalId = appointment.hospitalId._id || appointment.hospitalId;
      const doctorId = appointment.doctorId._id || appointment.doctorId;
      
      console.log('Emitting appointment-updated event to hospital:', hospitalId, 'and doctor:', doctorId);
      
      req.io.to(`hospital-${hospitalId}`).emit('appointment-updated', {
        appointment,
        message: `Appointment ${status}`
      });

      req.io.to(`doctor-${doctorId}`).emit('appointment-updated', {
        appointment,
        message: `Appointment ${status}`
      });
      
      // Emit queue update to hospital
      req.io.to(`hospital-${hospitalId}`).emit('queue-updated', {
        message: 'Queue updated',
        appointmentId: appointmentId
      });
      
      console.log('Socket events emitted successfully');
    } else {
      console.warn('Socket.IO not available for emitting events');
    }

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('❌ Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: error.message
    });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user can cancel this appointment
    if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own appointments'
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this appointment'
      });
    }

    // Update appointment
    await appointment.updateStatus('cancelled', {
      reason,
      cancelledBy: req.user.role
    });

    // Emit real-time update
    if (req.io) {
      const hospitalId = appointment.hospitalId._id || appointment.hospitalId;
      const doctorId = appointment.doctorId._id || appointment.doctorId;
      
      console.log('Emitting appointment-cancelled event to hospital:', hospitalId, 'and doctor:', doctorId);
      
      req.io.to(`hospital-${hospitalId}`).emit('appointment-cancelled', {
        appointmentId,
        message: 'Appointment cancelled'
      });
      
      req.io.to(`doctor-${doctorId}`).emit('appointment-cancelled', {
        appointmentId,
        message: 'Appointment cancelled'
      });
      
      // Emit queue update
      req.io.to(`hospital-${hospitalId}`).emit('queue-updated', {
        message: 'Queue updated',
        appointmentId: appointmentId
      });
      
      console.log('Appointment cancelled socket events emitted successfully');
    } else {
      console.warn('Socket.IO not available for cancelled appointment events');
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};

// Get appointment details
const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'firstName lastName phone patientInfo')
      .populate('doctorId', 'firstName lastName doctorInfo')
      .populate('hospitalId', 'name address phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { appointment }
    });

  } catch (error) {
    console.error('Get appointment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment',
      error: error.message
    });
  }
};

module.exports = {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentById
};