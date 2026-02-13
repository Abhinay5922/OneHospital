/**
 * User Model
 * Handles all user types: Super Admin, Hospital Admin, Doctor, Patient
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
  },
  
  // Role-based Information
  role: {
    type: String,
    enum: ['super_admin', 'hospital_admin', 'doctor', 'patient'],
    required: [true, 'User role is required']
  },
  
  // Hospital Association (for hospital_admin and doctor)
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: function() {
      // Only required for doctors, hospital_admin can register without it initially
      return this.role === 'doctor';
    }
  },
  
  // Doctor-specific Information
  doctorInfo: {
    specialization: {
      type: String,
      required: function() { return this.role === 'doctor'; }
    },
    qualification: {
      type: String,
      required: function() { return this.role === 'doctor'; }
    },
    experience: {
      type: Number,
      required: function() { return this.role === 'doctor'; }
    },
    consultationFee: {
      type: Number,
      required: function() { return this.role === 'doctor'; }
    },
    availableSlots: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      startTime: String,
      endTime: String,
      maxPatients: {
        type: Number,
        default: 20
      }
    }],
    isAvailable: {
      type: Boolean,
      default: true
    },
    emergencyAvailable: {
      type: Boolean,
      default: false
    }
  },
  
  // Patient-specific Information
  patientInfo: {
    dateOfBirth: {
      type: Date,
      required: function() { return this.role === 'patient'; }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: function() { return this.role === 'patient'; }
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  lastLogin: {
    type: Date
  },
  
  // Profile Image
  profileImage: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ hospitalId: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find doctors by hospital
userSchema.statics.findDoctorsByHospital = function(hospitalId) {
  return this.find({ 
    role: 'doctor', 
    hospitalId: hospitalId,
    isActive: true 
  }).select('-password');
};

module.exports = mongoose.model('User', userSchema);