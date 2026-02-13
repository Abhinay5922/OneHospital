/**
 * Queue Routes
 * Routes for real-time queue management
 */

const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { authenticateToken } = require('../middleware/auth');

// Get current queue for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const queue = await Appointment.getQueueStatus(doctorId, date);

    res.status(200).json({
      success: true,
      data: { queue }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get queue',
      error: error.message
    });
  }
});

// Get hospital queue summary
router.get('/hospital/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const summary = await Appointment.getHospitalQueueSummary(hospitalId, date);

    res.status(200).json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get hospital queue',
      error: error.message
    });
  }
});

module.exports = router;