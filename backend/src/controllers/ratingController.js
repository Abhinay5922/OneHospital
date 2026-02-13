/**
 * Rating Controller
 * Handles rating and feedback operations
 */

const { validationResult } = require('express-validator');
const Rating = require('../models/Rating');
const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');
const User = require('../models/User');

// Submit rating for completed appointment
const submitRating = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      appointmentId,
      hospitalId,
      doctorId,
      hospitalRating,
      doctorRating,
      ratingDetails,
      feedback,
      wouldRecommend
    } = req.body;

    const patientId = req.user._id;

    // Verify appointment exists and belongs to the patient
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: patientId,
      status: 'completed'
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Completed appointment not found or you are not authorized to rate it'
      });
    }

    // Check if rating already exists for this appointment
    const existingRating = await Rating.findOne({ appointmentId });
    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'Rating already submitted for this appointment'
      });
    }

    // Verify hospital and doctor IDs match the appointment
    if (appointment.hospitalId.toString() !== hospitalId || 
        appointment.doctorId.toString() !== doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Hospital or doctor ID does not match the appointment'
      });
    }

    // Create rating
    const ratingData = {
      patientId,
      appointmentId,
      hospitalId,
      doctorId,
      hospitalRating,
      doctorRating,
      ratingDetails: ratingDetails || {},
      feedback: feedback || {},
      wouldRecommend: wouldRecommend || { hospital: true, doctor: true },
      isVerified: true, // Auto-verify since it's linked to a completed appointment
      isPublic: true
    };

    const rating = await Rating.create(ratingData);

    // Update hospital and doctor statistics
    await updateHospitalStats(hospitalId);
    await updateDoctorStats(doctorId);

    // Populate the rating for response
    const populatedRating = await Rating.findById(rating._id)
      .populate('patientId', 'firstName lastName')
      .populate('hospitalId', 'name')
      .populate('doctorId', 'firstName lastName doctorInfo.specialization');

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: { rating: populatedRating }
    });

  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: error.message
    });
  }
};

// Get hospital ratings and reviews
const getHospitalRatings = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Get rating summary
    const summary = await Rating.getHospitalRatingSummary(hospitalId);

    // Get recent reviews with pagination
    const skip = (page - 1) * limit;
    const reviews = await Rating.find({
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
    .skip(skip)
    .limit(parseInt(limit));

    const totalReviews = await Rating.countDocuments({
      hospitalId: hospitalId,
      isPublic: true,
      isFlagged: false,
      $or: [
        { 'feedback.hospitalFeedback': { $exists: true, $ne: '' } },
        { 'feedback.doctorFeedback': { $exists: true, $ne: '' } }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        summary: summary[0] || { averageRating: 0, totalRatings: 0, ratingDistribution: {} },
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalReviews / limit),
          total: totalReviews,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get hospital ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hospital ratings',
      error: error.message
    });
  }
};

// Get doctor ratings and reviews
const getDoctorRatings = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Get rating summary
    const summary = await Rating.getDoctorRatingSummary(doctorId);

    // Get recent reviews with pagination
    const skip = (page - 1) * limit;
    const reviews = await Rating.find({
      doctorId: doctorId,
      isPublic: true,
      isFlagged: false,
      'feedback.doctorFeedback': { $exists: true, $ne: '' }
    })
    .populate('patientId', 'firstName lastName')
    .populate('hospitalId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalReviews = await Rating.countDocuments({
      doctorId: doctorId,
      isPublic: true,
      isFlagged: false,
      'feedback.doctorFeedback': { $exists: true, $ne: '' }
    });

    res.status(200).json({
      success: true,
      data: {
        summary: summary[0] || { averageRating: 0, totalRatings: 0, averageDetails: {} },
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalReviews / limit),
          total: totalReviews,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get doctor ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor ratings',
      error: error.message
    });
  }
};

// Get patient's ratings (their submitted ratings)
const getPatientRatings = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    const ratings = await Rating.find({ patientId })
      .populate('hospitalId', 'name address')
      .populate('doctorId', 'firstName lastName doctorInfo.specialization')
      .populate('appointmentId', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalRatings = await Rating.countDocuments({ patientId });

    res.status(200).json({
      success: true,
      data: {
        ratings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalRatings / limit),
          total: totalRatings,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get patient ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient ratings',
      error: error.message
    });
  }
};

// Get appointments eligible for rating
const getEligibleAppointments = async (req, res) => {
  try {
    const patientId = req.user._id;

    // Find completed appointments that haven't been rated yet
    const appointments = await Appointment.find({
      patientId: patientId,
      status: 'completed'
    })
    .populate('hospitalId', 'name address')
    .populate('doctorId', 'firstName lastName doctorInfo.specialization')
    .sort({ appointmentDate: -1 });

    // Filter out appointments that already have ratings
    const ratedAppointmentIds = await Rating.find({
      patientId: patientId
    }).distinct('appointmentId');

    const eligibleAppointments = appointments.filter(
      appointment => !ratedAppointmentIds.includes(appointment._id.toString())
    );

    res.status(200).json({
      success: true,
      data: { appointments: eligibleAppointments }
    });

  } catch (error) {
    console.error('Get eligible appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get eligible appointments',
      error: error.message
    });
  }
};

// Update rating (allow patients to edit their ratings within 7 days)
const updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const patientId = req.user._id;
    const updates = req.body;

    // Find the rating
    const rating = await Rating.findOne({
      _id: ratingId,
      patientId: patientId
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found or you are not authorized to update it'
      });
    }

    // Check if rating is within 7 days (allow editing)
    const daysSinceRating = (new Date() - rating.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceRating > 7) {
      return res.status(400).json({
        success: false,
        message: 'Ratings can only be updated within 7 days of submission'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'hospitalRating', 'doctorRating', 'ratingDetails', 
      'feedback', 'wouldRecommend'
    ];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        rating[field] = updates[field];
      }
    });

    await rating.save();

    // Update hospital and doctor statistics
    await updateHospitalStats(rating.hospitalId);
    await updateDoctorStats(rating.doctorId);

    const populatedRating = await Rating.findById(rating._id)
      .populate('patientId', 'firstName lastName')
      .populate('hospitalId', 'name')
      .populate('doctorId', 'firstName lastName doctorInfo.specialization');

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: { rating: populatedRating }
    });

  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rating',
      error: error.message
    });
  }
};

// Helper function to update hospital statistics
const updateHospitalStats = async (hospitalId) => {
  try {
    const summary = await Rating.getHospitalRatingSummary(hospitalId);
    const stats = summary[0];

    if (stats) {
      await Hospital.findByIdAndUpdate(hospitalId, {
        'stats.averageRating': stats.averageRating,
        'stats.totalRatings': stats.totalRatings,
        'stats.ratingDistribution': stats.ratingDistribution
      });
    }
  } catch (error) {
    console.error('Error updating hospital stats:', error);
  }
};

// Helper function to update doctor statistics
const updateDoctorStats = async (doctorId) => {
  try {
    const summary = await Rating.getDoctorRatingSummary(doctorId);
    const stats = summary[0];

    if (stats) {
      await User.findByIdAndUpdate(doctorId, {
        'doctorInfo.averageRating': stats.averageRating,
        'doctorInfo.totalRatings': stats.totalRatings,
        'doctorInfo.ratingDetails': stats.averageDetails
      });
    }
  } catch (error) {
    console.error('Error updating doctor stats:', error);
  }
};

module.exports = {
  submitRating,
  getHospitalRatings,
  getDoctorRatings,
  getPatientRatings,
  getEligibleAppointments,
  updateRating
};