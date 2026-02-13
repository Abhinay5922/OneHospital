/**
 * Authentication Routes
 * Routes for user registration, login, and profile management
 */

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/auth');
const { userValidation } = require('../utils/validators');

// Public routes
router.post('/register', userValidation.register, register);
router.post('/login', userValidation.login, login);

// Protected routes
router.use(authenticateToken); // Apply authentication to all routes below

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);

module.exports = router;