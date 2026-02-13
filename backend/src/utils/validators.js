/**
 * Validation Utilities
 * Common validation functions for the application
 */

const { body, param, query } = require('express-validator');

// User validation rules
const userValidation = {
  register: [
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('phone')
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be 10 digits'),
    
    body('role')
      .isIn(['hospital_admin', 'doctor', 'patient'])
      .withMessage('Invalid role specified')
  ],

  login: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ]
};

// Hospital validation rules
const hospitalValidation = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Hospital name must be between 3 and 100 characters'),
    
    body('registrationNumber')
      .trim()
      .notEmpty()
      .withMessage('Registration number is required'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('phone')
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be 10 digits'),
    
    body('address.street')
      .trim()
      .notEmpty()
      .withMessage('Street address is required'),
    
    body('address.city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
    
    body('address.state')
      .trim()
      .notEmpty()
      .withMessage('State is required'),
    
    body('address.pincode')
      .matches(/^\d{6}$/)
      .withMessage('Pincode must be 6 digits'),
    
    body('type')
      .isIn(['government', 'private', 'semi_government'])
      .withMessage('Invalid hospital type'),
    
    body('category')
      .isIn(['general', 'specialty', 'super_specialty', 'clinic'])
      .withMessage('Invalid hospital category'),
    
    body('totalBeds')
      .isInt({ min: 1 })
      .withMessage('Total beds must be at least 1')
  ]
};

// Appointment validation rules
const appointmentValidation = {
  book: [
    body('hospitalId')
      .isMongoId()
      .withMessage('Invalid hospital ID'),
    
    body('doctorId')
      .isMongoId()
      .withMessage('Invalid doctor ID'),
    
    body('appointmentDate')
      .isISO8601()
      .withMessage('Invalid appointment date format')
      .custom((value) => {
        const appointmentDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (appointmentDate < today) {
          throw new Error('Appointment date cannot be in the past');
        }
        
        // Check if appointment is not more than 30 days in future
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        
        if (appointmentDate > maxDate) {
          throw new Error('Appointment date cannot be more than 30 days in future');
        }
        
        return true;
      }),
    
    body('appointmentTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid time format (use HH:MM)'),
    
    body('patientDetails.symptoms')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Symptoms description must be between 10 and 500 characters'),
    
    body('patientDetails.urgency')
      .isIn(['low', 'medium', 'high', 'emergency'])
      .withMessage('Invalid urgency level')
  ]
};

// Rating validation rules
const ratingValidation = {
  submit: [
    body('appointmentId')
      .isMongoId()
      .withMessage('Invalid appointment ID'),
    
    body('hospitalRating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Hospital rating must be between 1 and 5'),
    
    body('doctorRating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Doctor rating must be between 1 and 5'),
    
    body('feedback.hospitalFeedback')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Hospital feedback cannot exceed 500 characters'),
    
    body('feedback.doctorFeedback')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Doctor feedback cannot exceed 500 characters')
  ]
};

// Common parameter validations
const paramValidation = {
  mongoId: (paramName) => [
    param(paramName)
      .isMongoId()
      .withMessage(`Invalid ${paramName}`)
  ]
};

// Query parameter validations
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  
  search: [
    query('search')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Search term must be at least 2 characters')
  ]
};

module.exports = {
  userValidation,
  hospitalValidation,
  appointmentValidation,
  ratingValidation,
  paramValidation,
  queryValidation
};