/**
 * Appointment Scheduler Routes
 * Routes for testing and managing appointment scheduler
 */

const express = require('express');
const router = express.Router();
const { checkMissedAppointmentsNow } = require('../utils/appointmentScheduler');
const { authenticateToken, authorize } = require('../middleware/auth');

// Manual check for missed appointments (for testing)
router.post('/check-missed', authenticateToken, authorize('doctor', 'hospital_admin', 'super_admin'), async (req, res) => {
  try {
    const result = await checkMissedAppointmentsNow();
    
    res.status(200).json({
      success: true,
      message: 'Missed appointments check completed',
      data: result
    });
  } catch (error) {
    console.error('Manual missed appointments check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check missed appointments',
      error: error.message
    });
  }
});

module.exports = router;