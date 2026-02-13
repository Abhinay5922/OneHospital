/**
 * Emergency Routes
 * Routes for emergency video consultation system
 */

const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  requestEmergencyCall,
  acceptEmergencyCall,
  startVideoCall,
  endEmergencyCall,
  getEmergencyCall,
  getPatientEmergencyCalls,
  getDoctorEmergencyCalls,
  addChatMessage,
  toggleEmergencyAvailability
} = require('../controllers/emergencyController');

const router = express.Router();

// Patient routes
router.post('/request', 
  authenticateToken,
  [
    body('urgencyLevel')
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid urgency level'),
    body('symptoms')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Symptoms must be between 10 and 1000 characters'),
    body('patientLocation.address')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters')
  ],
  requestEmergencyCall
);

router.get('/patient/history', authenticateToken, getPatientEmergencyCalls);

// Doctor routes
router.post('/accept/:callId', authenticateToken, acceptEmergencyCall);
router.get('/doctor/history', authenticateToken, getDoctorEmergencyCalls);
router.post('/doctor/availability', 
  authenticateToken,
  // Check if user is a doctor
  (req, res, next) => {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this endpoint'
      });
    }
    next();
  },
  [
    body('available')
      .exists()
      .withMessage('Available field is required')
      .isBoolean()
      .withMessage('Available must be a boolean value (true or false)')
  ],
  toggleEmergencyAvailability
);

// Shared routes (patient and doctor)
router.get('/:callId', authenticateToken, getEmergencyCall);
router.post('/:callId/start', authenticateToken, startVideoCall);
router.post('/:callId/end', 
  authenticateToken,
  [
    body('doctorNotes')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Doctor notes cannot exceed 2000 characters'),
    body('followUpNotes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Follow-up notes cannot exceed 1000 characters'),
    body('firstAidInstructions')
      .optional()
      .isArray()
      .withMessage('First aid instructions must be an array'),
    body('firstAidInstructions.*')
      .optional()
      .isLength({ min: 5, max: 500 })
      .withMessage('Each instruction must be between 5 and 500 characters')
  ],
  endEmergencyCall
);

router.post('/:callId/chat',
  authenticateToken,
  [
    body('message')
      .isLength({ min: 1, max: 500 })
      .withMessage('Message must be between 1 and 500 characters')
  ],
  addChatMessage
);

module.exports = router;