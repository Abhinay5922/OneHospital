/**
 * Rating Model
 * Manages patient ratings and feedback for hospitals and doctors
 */

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  // Patient Information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required']
  },
  
  // Related Appointment
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment ID is required']
  },
  
  // Hospital Rating
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'Hospital ID is required']
  },
  hospitalRating: {
    type: Number,
    required: [true, 'Hospital rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  
  // Doctor Rating
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required']
  },
  doctorRating: {
    type: Number,
    required: [true, 'Doctor rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  
  // Detailed Ratings
  ratingDetails: {
    // Hospital-specific ratings
    hospitalCleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    hospitalStaff: {
      type: Number,
      min: 1,
      max: 5
    },
    hospitalFacilities: {
      type: Number,
      min: 1,
      max: 5
    },
    waitingTime: {
      type: Number,
      min: 1,
      max: 5
    },
    
    // Doctor-specific ratings
    doctorBehavior: {
      type: Number,
      min: 1,
      max: 5
    },
    doctorExpertise: {
      type: Number,
      min: 1,
      max: 5
    },
    consultationQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    followUpCare: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Feedback
  feedback: {
    hospitalFeedback: {
      type: String,
      maxlength: [500, 'Hospital feedback cannot exceed 500 characters']
    },
    doctorFeedback: {
      type: String,
      maxlength: [500, 'Doctor feedback cannot exceed 500 characters']
    },
    suggestions: {
      type: String,
      maxlength: [300, 'Suggestions cannot exceed 300 characters']
    }
  },
  
  // Recommendation
  wouldRecommend: {
    hospital: {
      type: Boolean,
      default: true
    },
    doctor: {
      type: Boolean,
      default: true
    }
  },
  
  // Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Moderation
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for overall experience rating
ratingSchema.virtual('overallRating').get(function() {
  return Math.round(((this.hospitalRating + this.doctorRating) / 2) * 10) / 10;
});

// Virtual for detailed hospital rating average
ratingSchema.virtual('hospitalDetailedAverage').get(function() {
  const details = this.ratingDetails;
  const ratings = [
    details.hospitalCleanliness,
    details.hospitalStaff,
    details.hospitalFacilities,
    details.waitingTime
  ].filter(rating => rating !== undefined);
  
  if (ratings.length === 0) return this.hospitalRating;
  
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
});

// Virtual for detailed doctor rating average
ratingSchema.virtual('doctorDetailedAverage').get(function() {
  const details = this.ratingDetails;
  const ratings = [
    details.doctorBehavior,
    details.doctorExpertise,
    details.consultationQuality,
    details.followUpCare
  ].filter(rating => rating !== undefined);
  
  if (ratings.length === 0) return this.doctorRating;
  
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
});

// Indexes for better query performance
ratingSchema.index({ hospitalId: 1, createdAt: -1 });
ratingSchema.index({ doctorId: 1, createdAt: -1 });
ratingSchema.index({ patientId: 1 });
ratingSchema.index({ appointmentId: 1 }, { unique: true }); // One rating per appointment
ratingSchema.index({ hospitalRating: -1 });
ratingSchema.index({ doctorRating: -1 });
ratingSchema.index({ isPublic: 1, isFlagged: 1 });

// Compound index for filtering
ratingSchema.index({ 
  hospitalId: 1, 
  isPublic: 1, 
  isFlagged: 1, 
  createdAt: -1 
});

// Pre-save middleware for validation
ratingSchema.pre('save', function(next) {
  // Ensure ratings are within valid range
  if (this.hospitalRating < 1 || this.hospitalRating > 5) {
    return next(new Error('Hospital rating must be between 1 and 5'));
  }
  if (this.doctorRating < 1 || this.doctorRating > 5) {
    return next(new Error('Doctor rating must be between 1 and 5'));
  }
  
  next();
});

// Static method to get hospital rating summary
ratingSchema.statics.getHospitalRatingSummary = function(hospitalId) {
  return this.aggregate([
    {
      $match: {
        hospitalId: new mongoose.Types.ObjectId(hospitalId),
        isPublic: true,
        isFlagged: false
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$hospitalRating' },
        totalRatings: { $sum: 1 },
        ratingDistribution: {
          $push: '$hospitalRating'
        }
      }
    },
    {
      $project: {
        _id: 0,
        averageRating: { $round: ['$averageRating', 1] },
        totalRatings: 1,
        ratingDistribution: {
          '5': {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 5] }
              }
            }
          },
          '4': {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 4] }
              }
            }
          },
          '3': {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 3] }
              }
            }
          },
          '2': {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 2] }
              }
            }
          },
          '1': {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 1] }
              }
            }
          }
        }
      }
    }
  ]);
};

// Static method to get doctor rating summary
ratingSchema.statics.getDoctorRatingSummary = function(doctorId) {
  return this.aggregate([
    {
      $match: {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        isPublic: true,
        isFlagged: false
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$doctorRating' },
        totalRatings: { $sum: 1 },
        averageDetails: {
          doctorBehavior: { $avg: '$ratingDetails.doctorBehavior' },
          doctorExpertise: { $avg: '$ratingDetails.doctorExpertise' },
          consultationQuality: { $avg: '$ratingDetails.consultationQuality' },
          followUpCare: { $avg: '$ratingDetails.followUpCare' }
        }
      }
    },
    {
      $project: {
        _id: 0,
        averageRating: { $round: ['$averageRating', 1] },
        totalRatings: 1,
        averageDetails: {
          doctorBehavior: { $round: ['$averageDetails.doctorBehavior', 1] },
          doctorExpertise: { $round: ['$averageDetails.doctorExpertise', 1] },
          consultationQuality: { $round: ['$averageDetails.consultationQuality', 1] },
          followUpCare: { $round: ['$averageDetails.followUpCare', 1] }
        }
      }
    }
  ]);
};

// Static method to get recent reviews
ratingSchema.statics.getRecentReviews = function(hospitalId, limit = 10) {
  return this.find({
    hospitalId: hospitalId,
    isPublic: true,
    isFlagged: false,
    $or: [
      { 'feedback.hospitalFeedback': { $exists: true, $ne: '' } },
      { 'feedback.doctorFeedback': { $exists: true, $ne: '' } }
    ]
  })
  .populate('patientId', 'firstName lastName')
  .populate('doctorId', 'firstName lastName doctorInfo.specialization')
  .sort({ createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Rating', ratingSchema);