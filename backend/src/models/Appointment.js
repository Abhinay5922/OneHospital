/**
 * Appointment Model
 * Manages patient appointments with doctors and queue management
 */

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Patient Information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required']
  },
  
  // Hospital and Doctor Information
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'Hospital ID is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required']
  },
  
  // Appointment Details
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  
  // Queue Management
  tokenNumber: {
    type: Number,
    // Remove required validation, will be set by pre-save middleware
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  
  // Appointment Status
  status: {
    type: String,
    enum: ['confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'missed'],
    default: 'confirmed'
  },
  
  // Patient Details for the appointment
  patientDetails: {
    symptoms: {
      type: String,
      required: [true, 'Symptoms description is required']
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'medium'
    },
    previousVisit: {
      type: Boolean,
      default: false
    },
    allergies: [String],
    currentMedications: [String]
  },
  
  // Doctor's Notes (filled during/after consultation)
  doctorNotes: {
    diagnosis: String,
    prescription: [{
      medicine: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date,
    additionalNotes: String
  },
  
  // Timing Information
  checkedInAt: Date,
  consultationStartedAt: Date,
  consultationEndedAt: Date,
  
  // Payment Information
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'online'],
    default: 'cash'
  },
  
  // Cancellation Information
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['patient', 'doctor', 'hospital', 'system']
  },
  cancelledAt: Date,
  
  // Rating and Feedback
  rating: {
    doctorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    hospitalRating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for appointment duration
appointmentSchema.virtual('consultationDuration').get(function() {
  if (this.consultationStartedAt && this.consultationEndedAt) {
    return Math.round((this.consultationEndedAt - this.consultationStartedAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for formatted appointment date and time
appointmentSchema.virtual('formattedDateTime').get(function() {
  const date = this.appointmentDate.toLocaleDateString('en-IN');
  return `${date} at ${this.appointmentTime}`;
});

// Indexes for better query performance
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ hospitalId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ tokenNumber: 1, doctorId: 1, appointmentDate: 1 });

// Compound index for queue management
appointmentSchema.index({ 
  doctorId: 1, 
  appointmentDate: 1, 
  status: 1, 
  tokenNumber: 1 
});

// Pre-save middleware to generate token number
appointmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.tokenNumber) {
    try {
      // Find the highest token number for the same doctor on the same date
      const startOfDay = new Date(this.appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(this.appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const lastAppointment = await this.constructor
        .findOne({
          doctorId: this.doctorId,
          appointmentDate: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        })
        .sort({ tokenNumber: -1 });
      
      this.tokenNumber = lastAppointment ? lastAppointment.tokenNumber + 1 : 1;
      console.log(`Generated token number ${this.tokenNumber} for doctor ${this.doctorId} on ${this.appointmentDate}`);
    } catch (error) {
      console.error('Error generating token number:', error);
      // If there's an error, assign a default token number
      this.tokenNumber = 1;
    }
  }
  next();
});

// Method to update status and timing
appointmentSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  console.log('🔄 Updating appointment status in model:', {
    appointmentId: this._id,
    oldStatus: this.status,
    newStatus: newStatus,
    additionalData
  });
  
  this.status = newStatus;
  
  switch (newStatus) {
    case 'in_progress':
      this.consultationStartedAt = new Date();
      console.log('✅ Set consultationStartedAt for in_progress status');
      break;
    case 'completed':
      this.consultationEndedAt = new Date();
      console.log('✅ Set consultationEndedAt for completed status');
      if (additionalData.doctorNotes) {
        this.doctorNotes = { ...this.doctorNotes, ...additionalData.doctorNotes };
        console.log('✅ Updated doctor notes');
      }
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      if (additionalData.reason) this.cancellationReason = additionalData.reason;
      if (additionalData.cancelledBy) this.cancelledBy = additionalData.cancelledBy;
      console.log('✅ Set cancellation details');
      break;
  }
  
  console.log('💾 Saving appointment with new status:', newStatus);
  return this.save();
};

// Method to calculate estimated wait time
appointmentSchema.methods.calculateWaitTime = async function() {
  const queuePosition = await this.constructor.countDocuments({
    doctorId: this.doctorId,
    appointmentDate: {
      $gte: new Date(this.appointmentDate).setHours(0, 0, 0, 0),
      $lt: new Date(this.appointmentDate).setHours(23, 59, 59, 999)
    },
    tokenNumber: { $lt: this.tokenNumber },
    status: { $in: ['confirmed', 'in_progress'] }
  });
  
  // Assume 15 minutes per consultation on average
  this.estimatedWaitTime = queuePosition * 15;
  return this.save();
};

// Static method to get queue status for a doctor
appointmentSchema.statics.getQueueStatus = function(doctorId, date) {
  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);
  
  return this.find({
    doctorId: doctorId,
    appointmentDate: { $gte: startOfDay, $lt: endOfDay },
    status: { $in: ['confirmed', 'in_progress', 'completed'] }
  }).sort({ tokenNumber: 1 });
};

// Static method to get hospital queue summary
appointmentSchema.statics.getHospitalQueueSummary = function(hospitalId, date) {
  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        hospitalId: new mongoose.Types.ObjectId(hospitalId),
        appointmentDate: { $gte: new Date(startOfDay), $lt: new Date(endOfDay) }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Appointment', appointmentSchema);