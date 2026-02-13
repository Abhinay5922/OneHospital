/**
 * Rating Routes
 * Routes for rating and feedback management
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const { ratingValidation } = require('../utils/validators');
const ratingController = require('../controllers/ratingController');

// Submit rating for completed appointment
router.post('/', 
  authenticateToken, 
  authorize('patient'), 
  ratingValidation.submit, 
  ratingController.submitRating
);

// Get hospital ratings and reviews
router.get('/hospital/:hospitalId', ratingController.getHospitalRatings);

// Get doctor ratings and reviews
router.get('/doctor/:doctorId', ratingController.getDoctorRatings);

// Get patient's submitted ratings
router.get('/patient/my-ratings', 
  authenticateToken, 
  authorize('patient'), 
  ratingController.getPatientRatings
);

// Get appointments eligible for rating
router.get('/patient/eligible-appointments', 
  authenticateToken, 
  authorize('patient'), 
  ratingController.getEligibleAppointments
);

// Update rating (within 7 days)
router.put('/:ratingId', 
  authenticateToken, 
  authorize('patient'), 
  ratingController.updateRating
);

module.exports = router;