/**
 * Authentication Middleware
 * JWT token verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Hospital-specific authorization (for hospital admins and doctors)
const authorizeHospital = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const user = req.user;

    // Super admin can access any hospital
    if (user.role === 'super_admin') {
      return next();
    }

    // Hospital admin and doctors can only access their own hospital
    if ((user.role === 'hospital_admin' || user.role === 'doctor') && 
        user.hospitalId.toString() === hospitalId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this hospital'
    });
  } catch (error) {
    console.error('Hospital authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

// Doctor-specific authorization
const authorizeDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const user = req.user;

    // Super admin and hospital admin can access any doctor in their hospital
    if (user.role === 'super_admin') {
      return next();
    }

    if (user.role === 'hospital_admin') {
      // Check if doctor belongs to the same hospital
      const doctor = await User.findById(doctorId);
      if (doctor && doctor.hospitalId.toString() === user.hospitalId.toString()) {
        return next();
      }
    }

    // Doctor can only access their own data
    if (user.role === 'doctor' && user._id.toString() === doctorId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this doctor'
    });
  } catch (error) {
    console.error('Doctor authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

// Patient-specific authorization (patients can only access their own data)
const authorizePatient = (req, res, next) => {
  try {
    const { patientId } = req.params;
    const user = req.user;

    // Super admin can access any patient data
    if (user.role === 'super_admin') {
      return next();
    }

    // Hospital admin and doctors can access patients in their hospital context
    if (user.role === 'hospital_admin' || user.role === 'doctor') {
      return next();
    }

    // Patient can only access their own data
    if (user.role === 'patient' && user._id.toString() === patientId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this patient data'
    });
  } catch (error) {
    console.error('Patient authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  authorize,
  authorizeHospital,
  authorizeDoctor,
  authorizePatient,
  optionalAuth
};