/**
 * Appointment Routes
 * Routes for appointment booking and management
 */

const express = require('express');
const router = express.Router();

const {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentById
} = require('../controllers/appointmentController');

const { 
  authenticateToken, 
  authorize, 
  authorizeDoctor 
} = require('../middleware/auth');

const { 
  appointmentValidation, 
  paramValidation 
} = require('../utils/validators');

// All routes require authentication
router.use(authenticateToken);

// Patient routes
router.post('/', 
  authorize('patient'), 
  appointmentValidation.book, 
  bookAppointment
);

router.get('/patient', 
  authorize('patient'), 
  getPatientAppointments
);

// Doctor routes
router.get('/doctor', 
  authorize('doctor'), 
  getDoctorAppointments
);

router.put('/:appointmentId/status',
  paramValidation.mongoId('appointmentId'),
  authorize('doctor', 'hospital_admin'),
  updateAppointmentStatus
);

// Common routes
router.get('/:appointmentId',
  paramValidation.mongoId('appointmentId'),
  getAppointmentById
);

router.put('/:appointmentId/cancel',
  paramValidation.mongoId('appointmentId'),
  cancelAppointment
);

module.exports = router;