/**
 * Admin Routes
 * Routes for super admin operations
 */

const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require super admin access
router.use(authenticateToken, authorize('super_admin'));

// Get pending hospital approvals
router.get('/hospitals/pending', async (req, res) => {
  try {
    const hospitals = await Hospital.find({ approvalStatus: 'pending' })
      .populate('adminId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { hospitals }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get pending hospitals',
      error: error.message
    });
  }
});

// Get all hospitals (including pending and rejected)
router.get('/hospitals', async (req, res) => {
  try {
    const hospitals = await Hospital.find({})
      .populate('adminId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { hospitals }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get hospitals',
      error: error.message
    });
  }
});

// Approve/reject hospital
router.put('/hospitals/:hospitalId/approval', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { status, rejectionReason } = req.body;

    const updateData = {
      approvalStatus: status,
      approvedBy: req.user._id,
      approvedAt: new Date()
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const hospital = await Hospital.findByIdAndUpdate(hospitalId, updateData, { new: true });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Hospital ${status} successfully`,
      data: { hospital }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update hospital status',
      error: error.message
    });
  }
});

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalHospitals: await Hospital.countDocuments({ approvalStatus: 'approved' }),
      pendingHospitals: await Hospital.countDocuments({ approvalStatus: 'pending' }),
      totalDoctors: await User.countDocuments({ role: 'doctor', isActive: true }),
      totalPatients: await User.countDocuments({ role: 'patient', isActive: true })
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

module.exports = router;