/**
 * Hospital Model
 * Manages hospital information, departments, and operational details
 */

const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
    maxlength: [100, 'Hospital name cannot exceed 100 characters']
  },
  registrationNumber: {
    type: String,
    required: [true, 'Hospital registration number is required'],
    unique: true,
    trim: true
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, 'Hospital email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Hospital phone is required'],
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Hospital Details
  type: {
    type: String,
    enum: ['government', 'private', 'semi_government'],
    required: [true, 'Hospital type is required']
  },
  category: {
    type: String,
    enum: ['general', 'specialty', 'super_specialty', 'clinic'],
    required: [true, 'Hospital category is required']
  },
  
  // Operational Information
  departments: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  facilities: [{
    name: String,
    description: String
  }],
  
  operatingHours: {
    weekdays: {
      open: {
        type: String,
        default: '08:00'
      },
      close: {
        type: String,
        default: '20:00'
      }
    },
    weekends: {
      open: {
        type: String,
        default: '08:00'
      },
      close: {
        type: String,
        default: '18:00'
      }
    },
    emergency24x7: {
      type: Boolean,
      default: false
    }
  },
  
  // Capacity Information
  totalBeds: {
    type: Number,
    required: [true, 'Total beds count is required'],
    min: [1, 'Hospital must have at least 1 bed']
  },
  availableBeds: {
    type: Number,
    default: function() {
      return this.totalBeds;
    }
  },
  
  // Admin Information
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Hospital admin is required']
  },
  
  // Approval Status
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Images
  images: [{
    url: String,
    caption: String
  }],
  logo: {
    type: String
  },
  
  // Statistics (for performance tracking)
  stats: {
    totalAppointments: {
      type: Number,
      default: 0
    },
    completedAppointments: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full address
hospitalSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
});

// Virtual for current queue count (will be populated from appointments)
hospitalSchema.virtual('currentQueueCount', {
  ref: 'Appointment',
  localField: '_id',
  foreignField: 'hospitalId',
  count: true,
  match: { 
    status: { $in: ['confirmed', 'in_progress'] },
    appointmentDate: {
      $gte: new Date().setHours(0, 0, 0, 0),
      $lt: new Date().setHours(23, 59, 59, 999)
    }
  }
});

// Indexes for better query performance
hospitalSchema.index({ 'address.city': 1 });
hospitalSchema.index({ 'address.state': 1 });
hospitalSchema.index({ type: 1 });
hospitalSchema.index({ category: 1 });
hospitalSchema.index({ approvalStatus: 1 });
hospitalSchema.index({ 'stats.averageRating': -1 });

// Pre-save middleware
hospitalSchema.pre('save', function(next) {
  // Ensure available beds doesn't exceed total beds
  if (this.availableBeds > this.totalBeds) {
    this.availableBeds = this.totalBeds;
  }
  next();
});

// Method to update rating
hospitalSchema.methods.updateRating = function(newRating) {
  const totalRatings = this.stats.totalRatings;
  const currentAverage = this.stats.averageRating;
  
  // Calculate new average
  const newAverage = ((currentAverage * totalRatings) + newRating) / (totalRatings + 1);
  
  this.stats.averageRating = Math.round(newAverage * 10) / 10; // Round to 1 decimal
  this.stats.totalRatings += 1;
  
  return this.save();
};

// Static method to find hospitals by location
hospitalSchema.statics.findByLocation = function(city, state) {
  return this.find({
    'address.city': new RegExp(city, 'i'),
    'address.state': new RegExp(state, 'i'),
    approvalStatus: 'approved',
    isActive: true
  });
};

// Static method to find hospitals with available slots
hospitalSchema.statics.findWithAvailableSlots = function() {
  return this.find({
    approvalStatus: 'approved',
    isActive: true,
    availableBeds: { $gt: 0 }
  });
};

module.exports = mongoose.model('Hospital', hospitalSchema);