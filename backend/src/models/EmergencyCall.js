/**
 * Emergency Call Model
 * Manages emergency video consultation requests and sessions
 */

const mongoose = require('mongoose');

const emergencyCallSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    default: null
  },
  callId: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'connecting', 'active', 'completed', 'cancelled', 'timeout'],
    default: 'pending'
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  symptoms: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  patientLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  callStartTime: {
    type: Date,
    default: null
  },
  callEndTime: {
    type: Date,
    default: null
  },
  callDuration: {
    type: Number, // in minutes
    default: 0
  },
  doctorNotes: {
    type: String,
    maxlength: 2000
  },
  firstAidInstructions: [{
    instruction: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpNotes: String,
  consultationFee: {
    type: Number,
    default: 200 // Emergency consultation fee
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'waived'],
    default: 'pending'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  recordingUrl: String, // For call recording if implemented
  chatHistory: [{
    sender: {
      type: String,
      enum: ['patient', 'doctor']
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate unique call ID
emergencyCallSchema.pre('save', function(next) {
  if (!this.callId) {
    this.callId = `EC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Calculate call duration when call ends
emergencyCallSchema.methods.endCall = function() {
  if (this.callStartTime && !this.callEndTime) {
    this.callEndTime = new Date();
    this.callDuration = Math.round((this.callEndTime - this.callStartTime) / (1000 * 60)); // in minutes
  }
  this.status = 'completed';
  return this.save();
};

// Add first aid instruction
emergencyCallSchema.methods.addFirstAidInstruction = function(instruction) {
  this.firstAidInstructions.push({
    instruction,
    timestamp: new Date()
  });
  return this.save();
};

// Add chat message
emergencyCallSchema.methods.addChatMessage = function(sender, message) {
  this.chatHistory.push({
    sender,
    message,
    timestamp: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('EmergencyCall', emergencyCallSchema);