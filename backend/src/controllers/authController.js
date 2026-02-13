/**
 * Authentication Controller
 * Handles user registration, login, and authentication-related operations
 */

const { validationResult } = require('express-validator');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { generateToken } = require('../utils/jwt');

// Register new user
const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      hospitalId,
      doctorInfo,
      patientInfo,
      hospitalInfo
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate hospital association for hospital_admin and doctor roles
    if (role === 'doctor' && hospitalId) {
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        return res.status(400).json({
          success: false,
          message: 'Invalid hospital ID'
        });
      }
      
      if (hospital.approvalStatus !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Hospital is not approved yet'
        });
      }
    }

    // For hospital_admin, hospitalId is optional during registration
    // They will register their hospital after account creation
    if (role === 'hospital_admin' && hospitalId) {
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        return res.status(400).json({
          success: false,
          message: 'Invalid hospital ID'
        });
      }
    }

    // Create user object
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      role
    };

    // Add role-specific data
    if (role === 'doctor' && hospitalId) {
      userData.hospitalId = hospitalId;
    }

    // For hospital_admin, hospitalId is optional during registration
    if (role === 'hospital_admin' && hospitalId) {
      userData.hospitalId = hospitalId;
    }

    if (role === 'doctor' && doctorInfo) {
      userData.doctorInfo = doctorInfo;
    }

    if (role === 'patient' && patientInfo) {
      userData.patientInfo = patientInfo;
    }

    // Create user
    const user = await User.create(userData);

    // If hospital_admin provided hospital info, create the hospital
    let hospital = null;
    if (role === 'hospital_admin' && hospitalInfo && hospitalInfo.name) {
      try {
        // Check if hospital with same registration number exists
        if (hospitalInfo.registrationNumber) {
          const existingHospital = await Hospital.findOne({
            registrationNumber: hospitalInfo.registrationNumber
          });

          if (existingHospital) {
            // Delete the user we just created since hospital registration failed
            await User.findByIdAndDelete(user._id);
            return res.status(400).json({
              success: false,
              message: 'Hospital with this registration number already exists'
            });
          }
        }

        // Create hospital
        const hospitalData = {
          name: hospitalInfo.name,
          registrationNumber: hospitalInfo.registrationNumber || `AUTO_${Date.now()}`,
          email: email, // Use admin's email as hospital email
          phone: phone, // Use admin's phone as hospital phone
          address: {
            street: hospitalInfo.address || '',
            city: hospitalInfo.city || '',
            state: hospitalInfo.state || '',
            pincode: '000000' // Default pincode
          },
          type: hospitalInfo.type || 'private',
          category: 'general',
          departments: [
            { name: 'General Medicine', description: 'General medical care', isActive: true }
          ],
          facilities: [
            { name: 'OPD', description: 'Outpatient Department' }
          ],
          operatingHours: {
            weekdays: { open: '09:00', close: '18:00' },
            weekends: { open: '09:00', close: '14:00' },
            emergency24x7: false
          },
          totalBeds: 50,
          availableBeds: 45,
          adminId: user._id,
          approvalStatus: 'pending',
          isActive: true
        };

        hospital = await Hospital.create(hospitalData);

        // Update user with hospital association
        await User.findByIdAndUpdate(user._id, {
          hospitalId: hospital._id
        });

      } catch (hospitalError) {
        console.error('Hospital creation error:', hospitalError);
        // Delete the user we created since hospital registration failed
        await User.findByIdAndDelete(user._id);
        return res.status(500).json({
          success: false,
          message: 'User created but hospital registration failed. Please try again.',
          error: hospitalError.message
        });
      }
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Prepare response
    const responseData = {
      user: user.getPublicProfile(),
      token
    };

    let message = 'User registered successfully';
    if (hospital) {
      responseData.hospital = hospital;
      message = 'Account and hospital registered successfully. Hospital is pending approval.';
    } else if (role === 'hospital_admin') {
      message = 'Account registered successfully. You can register your hospital from the dashboard.';
    }

    res.status(201).json({
      success: true,
      message: message,
      data: responseData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Populate hospital info if applicable
    let populatedUser = user;
    if (user.hospitalId) {
      populatedUser = await User.findById(user._id)
        .populate('hospitalId', 'name address type category')
        .select('-password');
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: populatedUser.getPublicProfile(),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    let user = req.user;

    // Populate hospital info if applicable
    if (user.hospitalId) {
      user = await User.findById(user._id)
        .populate('hospitalId', 'name address type category approvalStatus')
        .select('-password');
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.email;
    delete updates.role;
    delete updates.hospitalId;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).populate('hospitalId', 'name address type category');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Logout (client-side token removal, server-side logging)
const logout = async (req, res) => {
  try {
    // In a more advanced implementation, you might maintain a blacklist of tokens
    // For now, we'll just log the logout action
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};