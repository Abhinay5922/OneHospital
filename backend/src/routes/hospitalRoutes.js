/**
 * Hospital Routes
 * Routes for hospital management and search operations
 */

const express = require('express');
const router = express.Router();

const {
  registerHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  getHospitalDashboard,
  searchHospitals
} = require('../controllers/hospitalController');

const { 
  authenticateToken, 
  authorize, 
  authorizeHospital,
  optionalAuth 
} = require('../middleware/auth');

const { 
  hospitalValidation, 
  paramValidation, 
  queryValidation 
} = require('../utils/validators');

// Public routes
router.get('/', optionalAuth, queryValidation.pagination, getHospitals);
router.get('/search', optionalAuth, searchHospitals);
router.get('/:hospitalId', paramValidation.mongoId('hospitalId'), getHospitalById);

// Protected routes
router.use(authenticateToken);

// Hospital admin only routes
router.post('/', 
  authorize('hospital_admin'), 
  hospitalValidation.register, 
  registerHospital
);

router.put('/:hospitalId', 
  paramValidation.mongoId('hospitalId'),
  authorize('hospital_admin', 'super_admin'),
  authorizeHospital,
  updateHospital
);

router.get('/:hospitalId/dashboard',
  paramValidation.mongoId('hospitalId'),
  authorize('hospital_admin', 'super_admin'),
  authorizeHospital,
  getHospitalDashboard
);

module.exports = router;