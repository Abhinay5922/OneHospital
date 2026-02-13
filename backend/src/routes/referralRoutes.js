/**
 * Referral Routes
 * Routes for doctor-to-doctor patient referrals
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  createReferral,
  getSentReferrals,
  getReceivedReferrals,
  getReferralById,
  respondToReferral,
  getAvailableDoctors,
  getReferralStats
} = require('../controllers/referralController');

const { authenticateToken, authorize } = require('../middleware/auth');

// Validation middleware
const referralValidation = [
  body('patientId')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  
  body('referredToDoctorId')
    .notEmpty()
    .withMessage('Referred to doctor ID is required')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  
  body('originalAppointmentId')
    .notEmpty()
    .withMessage('Original appointment ID is required')
    .isMongoId()
    .withMessage('Invalid appointment ID'),
  
  body('referralReason')
    .notEmpty()
    .withMessage('Referral reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Referral reason must be between 10 and 500 characters'),
  
  body('patientCondition')
    .notEmpty()
    .withMessage('Patient condition is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Patient condition must be between 10 and 1000 characters'),
  
  body('specialtyRequired')
    .notEmpty()
    .withMessage('Specialty required is required')
    .isIn([
      'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology',
      'Dermatology', 'Psychiatry', 'Oncology', 'Endocrinology', 'Gastroenterology',
      'Pulmonology', 'Nephrology', 'Rheumatology', 'Ophthalmology', 'ENT',
      'Urology', 'Anesthesiology', 'Radiology', 'Pathology', 'General Surgery'
    ])
    .withMessage('Invalid specialty'),
  
  body('urgencyLevel')
    .optional()
    .isIn(['routine', 'urgent', 'emergency'])
    .withMessage('Invalid urgency level'),
  
  body('symptoms')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Symptoms cannot exceed 500 characters'),
  
  body('currentTreatment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Current treatment cannot exceed 500 characters'),
  
  body('additionalNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Additional notes cannot exceed 1000 characters')
];

const responseValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['accepted', 'declined'])
    .withMessage('Status must be accepted or declined'),
  
  body('responseNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Response notes cannot exceed 500 characters')
];

// All routes require authentication and doctor role
router.use(authenticateToken);
router.use(authorize('doctor'));

// Create new referral
router.post('/', referralValidation, createReferral);

// Get sent referrals
router.get('/sent', getSentReferrals);

// Get received referrals
router.get('/received', getReceivedReferrals);

// Get referral statistics
router.get('/stats', getReferralStats);

// Get available doctors for referral
router.get('/doctors', getAvailableDoctors);

// Get specific referral
router.get('/:referralId', getReferralById);

// Respond to referral (accept/decline)
router.put('/:referralId/respond', responseValidation, respondToReferral);

module.exports = router;