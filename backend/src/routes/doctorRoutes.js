/**
 * Doctor Routes
 * Routes for doctor management and operations
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { authenticateToken, authorize, authorizeHospital } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Get doctors by hospital
router.get('/hospital/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    const doctors = await User.find({
      hospitalId,
      role: 'doctor',
      isActive: true
    }).select('firstName lastName email phone doctorInfo profileImage createdAt');

    res.status(200).json({
      success: true,
      data: { doctors }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get doctors',
      error: error.message
    });
  }
});

// Add new doctor (Hospital Admin only)
router.post('/add', authenticateToken, authorize('hospital_admin', 'super_admin'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      doctorInfo
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Get hospital ID from authenticated user
    const hospitalId = req.user.hospitalId._id || req.user.hospitalId;

    // Create doctor
    const doctor = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'doctor',
      hospitalId,
      isActive: true,
      isVerified: true,
      doctorInfo: {
        specialization: doctorInfo?.specialization || 'General Medicine',
        qualification: doctorInfo?.qualification || 'MBBS',
        experience: doctorInfo?.experience || 0,
        consultationFee: doctorInfo?.consultationFee || 500,
        isAvailable: doctorInfo?.isAvailable !== false,
        availableSlots: doctorInfo?.availableSlots || [
          {
            day: 'Monday',
            startTime: '09:00',
            endTime: '17:00',
            maxPatients: 20
          },
          {
            day: 'Tuesday',
            startTime: '09:00',
            endTime: '17:00',
            maxPatients: 20
          },
          {
            day: 'Wednesday',
            startTime: '09:00',
            endTime: '17:00',
            maxPatients: 20
          },
          {
            day: 'Thursday',
            startTime: '09:00',
            endTime: '17:00',
            maxPatients: 20
          },
          {
            day: 'Friday',
            startTime: '09:00',
            endTime: '17:00',
            maxPatients: 20
          }
        ]
      }
    });

    // Remove password from response
    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.status(201).json({
      success: true,
      message: 'Doctor added successfully',
      data: { doctor: doctorResponse }
    });

  } catch (error) {
    console.error('Add doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add doctor',
      error: error.message
    });
  }
});

// Update doctor information
router.put('/:doctorId', authenticateToken, authorize('hospital_admin', 'super_admin', 'doctor'), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const updates = req.body;

    // Find the doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Authorization check
    if (req.user.role === 'doctor' && req.user._id.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    if (req.user.role === 'hospital_admin') {
      const hospitalId = req.user.hospitalId._id || req.user.hospitalId;
      if (doctor.hospitalId.toString() !== hospitalId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update doctors in your hospital'
        });
      }
    }

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates.role;
    delete updates.hospitalId;

    // Update doctor
    const updatedDoctor = await User.findByIdAndUpdate(
      doctorId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: { doctor: updatedDoctor }
    });

  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor',
      error: error.message
    });
  }
});

// Delete/Deactivate doctor
router.delete('/:doctorId', authenticateToken, authorize('hospital_admin', 'super_admin'), async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Find the doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Authorization check for hospital admin
    if (req.user.role === 'hospital_admin') {
      const hospitalId = req.user.hospitalId._id || req.user.hospitalId;
      if (doctor.hospitalId.toString() !== hospitalId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only manage doctors in your hospital'
        });
      }
    }

    // Deactivate instead of delete to maintain data integrity
    await User.findByIdAndUpdate(doctorId, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Doctor deactivated successfully'
    });

  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate doctor',
      error: error.message
    });
  }
});

// Update doctor availability
router.put('/availability', authenticateToken, authorize('doctor'), async (req, res) => {
  try {
    const { isAvailable, availableSlots } = req.body;
    
    const doctor = await User.findByIdAndUpdate(
      req.user._id,
      {
        'doctorInfo.isAvailable': isAvailable,
        'doctorInfo.availableSlots': availableSlots
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: { doctor }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
});

// Get doctor profile
router.get('/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const doctor = await User.findById(doctorId)
      .select('-password')
      .populate('hospitalId', 'name address');

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { doctor }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor profile',
      error: error.message
    });
  }
});

module.exports = router;