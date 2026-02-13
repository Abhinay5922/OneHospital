/**
 * Referral Model
 * Manages doctor-to-doctor patient referrals
 */

const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  // Basic Information
  referralNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Patient Information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  
  // Referring Doctor (Current Doctor)
  referringDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Referring doctor is required']
  },
  
  // Referred To Doctor (Specialist)
  referredToDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Referred to doctor is required']
  },
  
  // Hospital Information
  referringHospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  
  referredToHospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  
  // Original Appointment
  originalAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  
  // Referral Details
  referralReason: {
    type: String,
    required: [true, 'Referral reason is required'],
    maxlength: [500, 'Referral reason cannot exceed 500 characters']
  },
  
  patientCondition: {
    type: String,
    required: [true, 'Patient condition description is required'],
    maxlength: [1000, 'Patient condition cannot exceed 1000 characters']
  },
  
  symptoms: {
    type: String,
    maxlength: [500, 'Symptoms cannot exceed 500 characters']
  },
  
  currentTreatment: {
    type: String,
    maxlength: [500, 'Current treatment cannot exceed 500 characters']
  },
  
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  
  testResults: [{
    testName: String,
    result: String,
    date: Date,
    notes: String
  }],
  
  urgencyLevel: {
    type: String,
    enum: ['routine', 'urgent', 'emergency'],
    default: 'routine'
  },
  
  specialtyRequired: {
    type: String,
    required: [true, 'Specialty required is required'],
    enum: [
      'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology',
      'Dermatology', 'Psychiatry', 'Oncology', 'Endocrinology', 'Gastroenterology',
      'Pulmonology', 'Nephrology', 'Rheumatology', 'Ophthalmology', 'ENT',
      'Urology', 'Anesthesiology', 'Radiology', 'Pathology', 'General Surgery'
    ]
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Response from Referred Doctor
  responseDate: Date,
  responseNotes: {
    type: String,
    maxlength: [500, 'Response notes cannot exceed 500 characters']
  },
  
  // Follow-up Information
  followUpRequired: {
    type: Boolean,
    default: false
  },
  
  followUpInstructions: {
    type: String,
    maxlength: [500, 'Follow-up instructions cannot exceed 500 characters']
  },
  
  // Priority and Timeline
  preferredAppointmentDate: Date,
  expectedDuration: {
    type: String,
    enum: ['30min', '1hour', '2hours', 'half-day', 'full-day']
  },
  
  // Additional Notes
  additionalNotes: {
    type: String,
    maxlength: [1000, 'Additional notes cannot exceed 1000 characters']
  },
  
  // Attachments (file paths or URLs)
  attachments: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tracking
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate referral number
referralSchema.pre('save', async function(next) {
  if (!this.referralNumber) {
    const count = await mongoose.model('Referral').countDocuments();
    this.referralNumber = `REF${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes for better query performance
referralSchema.index({ patientId: 1 });
referralSchema.index({ referringDoctorId: 1 });
referralSchema.index({ referredToDoctorId: 1 });
referralSchema.index({ status: 1 });
referralSchema.index({ urgencyLevel: 1 });
referralSchema.index({ createdAt: -1 });

// Virtual for referral age
referralSchema.virtual('referralAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to get referrals by doctor
referralSchema.statics.getReferralsByDoctor = function(doctorId, type = 'sent') {
  const query = type === 'sent' 
    ? { referringDoctorId: doctorId }
    : { referredToDoctorId: doctorId };
    
  return this.find(query)
    .populate('patientId', 'firstName lastName email phone')
    .populate('referringDoctorId', 'firstName lastName doctorInfo.specialization')
    .populate('referredToDoctorId', 'firstName lastName doctorInfo.specialization')
    .populate('referringHospitalId', 'name')
    .populate('referredToHospitalId', 'name')
    .sort({ createdAt: -1 });
};

// Static method to get pending referrals for a doctor
referralSchema.statics.getPendingReferrals = function(doctorId) {
  return this.find({ 
    referredToDoctorId: doctorId, 
    status: 'pending' 
  })
    .populate('patientId', 'firstName lastName email phone')
    .populate('referringDoctorId', 'firstName lastName doctorInfo.specialization')
    .populate('referringHospitalId', 'name')
    .sort({ urgencyLevel: 1, createdAt: -1 });
};

module.exports = mongoose.model('Referral', referralSchema);