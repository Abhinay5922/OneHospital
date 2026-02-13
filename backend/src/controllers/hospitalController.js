/**
 * Hospital Controller
 * Handles hospital registration, management, and search operations
 */

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// Register new hospital
const registerHospital = async (req, res) => {
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

    const hospitalData = {
      ...req.body,
      adminId: req.user._id
    };

    // Check if hospital with same registration number exists
    const existingHospital = await Hospital.findOne({
      registrationNumber: hospitalData.registrationNumber
    });

    if (existingHospital) {
      return res.status(400).json({
        success: false,
        message: 'Hospital with this registration number already exists'
      });
    }

    // Create hospital
    const hospital = await Hospital.create(hospitalData);

    // Update user's hospital association
    await User.findByIdAndUpdate(req.user._id, {
      hospitalId: hospital._id
    });

    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully. Awaiting admin approval.',
      data: { hospital }
    });

  } catch (error) {
    console.error('Hospital registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Hospital registration failed',
      error: error.message
    });
  }
};

// Get all hospitals (with filters and search)
const getHospitals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      city,
      state,
      type,
      category,
      sortBy = 'stats.averageRating',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { approvalStatus: 'approved', isActive: true };

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } }
      ];
    }

    // Location filters
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }
    if (state) {
      query['address.state'] = { $regex: state, $options: 'i' };
    }

    // Type and category filters
    if (type) query.type = type;
    if (category) query.category = category;

    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const hospitals = await Hospital.find(query)
      .populate('adminId', 'firstName lastName email phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Hospital.countDocuments(query);

    // Get current queue counts and updated stats for each hospital
    const hospitalsWithQueue = await Promise.all(
      hospitals.map(async (hospital) => {
        const currentQueue = await Appointment.countDocuments({
          hospitalId: hospital._id,
          appointmentDate: {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lt: new Date().setHours(23, 59, 59, 999)
          },
          status: { $in: ['confirmed', 'in_progress'] }
        });

        // Get real-time total appointments
        const totalAppointments = await Appointment.countDocuments({
          hospitalId: hospital._id
        });

        // Get real-time completed appointments
        const completedAppointments = await Appointment.countDocuments({
          hospitalId: hospital._id,
          status: 'completed'
        });

        // Get average rating from appointments
        const ratingStats = await Appointment.aggregate([
          {
            $match: {
              hospitalId: hospital._id,
              rating: { $exists: true, $ne: null }
            }
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalRatings: { $sum: 1 }
            }
          }
        ]);

        const avgRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;
        const totalRatings = ratingStats.length > 0 ? ratingStats[0].totalRatings : 0;

        return {
          ...hospital.toObject(),
          currentQueueCount: currentQueue,
          stats: {
            ...hospital.stats,
            totalAppointments,
            completedAppointments,
            averageRating: Math.round(avgRating * 10) / 10,
            totalRatings
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        hospitals: hospitalsWithQueue,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hospitals',
      error: error.message
    });
  }
};

// Get hospital by ID
const getHospitalById = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    const hospital = await Hospital.findById(hospitalId)
      .populate('adminId', 'firstName lastName email phone');

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Get current queue count
    const currentQueue = await Appointment.countDocuments({
      hospitalId: hospital._id,
      appointmentDate: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      },
      status: { $in: ['confirmed', 'in_progress'] }
    });

    // Get real-time statistics
    const totalAppointments = await Appointment.countDocuments({
      hospitalId: hospital._id
    });

    const completedAppointments = await Appointment.countDocuments({
      hospitalId: hospital._id,
      status: 'completed'
    });

    // Get doctors in this hospital
    const doctors = await User.find({
      hospitalId: hospital._id,
      role: 'doctor',
      isActive: true
    }).select('firstName lastName doctorInfo profileImage');

    // Get average rating from appointments/ratings
    const ratingStats = await Appointment.aggregate([
      {
        $match: {
          hospitalId: new mongoose.Types.ObjectId(hospitalId),
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    const avgRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;
    const totalRatings = ratingStats.length > 0 ? ratingStats[0].totalRatings : 0;

    // Create updated hospital object with real-time stats
    const hospitalWithStats = {
      ...hospital.toObject(),
      currentQueueCount: currentQueue,
      stats: {
        ...hospital.stats,
        totalAppointments,
        completedAppointments,
        averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        totalRatings
      },
      doctors
    };

    res.status(200).json({
      success: true,
      data: {
        hospital: hospitalWithStats
      }
    });

  } catch (error) {
    console.error('Get hospital by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hospital',
      error: error.message
    });
  }
};

// Update hospital
const updateHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated via this endpoint
    delete updates.adminId;
    delete updates.approvalStatus;
    delete updates.approvedBy;
    delete updates.approvedAt;
    delete updates.stats;

    const hospital = await Hospital.findByIdAndUpdate(
      hospitalId,
      updates,
      { new: true, runValidators: true }
    ).populate('adminId', 'firstName lastName email phone');

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hospital updated successfully',
      data: { hospital }
    });

  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hospital',
      error: error.message
    });
  }
};

// Get hospital dashboard data
const getHospitalDashboard = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get today's appointments summary
    const appointmentsSummary = await Appointment.aggregate([
      {
        $match: {
          hospitalId: new mongoose.Types.ObjectId(hospitalId),
          appointmentDate: { $gte: startOfDay, $lt: endOfDay }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get doctor-wise queue status for today
    const doctorQueues = await Appointment.aggregate([
      {
        $match: {
          hospitalId: new mongoose.Types.ObjectId(hospitalId),
          appointmentDate: { $gte: startOfDay, $lt: endOfDay },
          status: { $in: ['confirmed', 'in_progress'] }
        }
      },
      {
        $group: {
          _id: '$doctorId',
          queueCount: { $sum: 1 },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $unwind: '$doctor'
      },
      {
        $project: {
          doctorName: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] },
          specialization: '$doctor.doctorInfo.specialization',
          queueCount: 1,
          inProgress: 1
        }
      }
    ]);

    // Get ALL recent appointments (not just today's)
    const recentAppointments = await Appointment.find({
      hospitalId
    })
    .populate('patientId', 'firstName lastName phone')
    .populate('doctorId', 'firstName lastName doctorInfo.specialization')
    .sort({ createdAt: -1 })
    .limit(20);

    // ENHANCED ANALYTICS DATA
    
    // Get total appointments count
    const totalAppointments = await Appointment.countDocuments({
      hospitalId: new mongoose.Types.ObjectId(hospitalId)
    });

    // Get completed appointments count
    const completedAppointments = await Appointment.countDocuments({
      hospitalId: new mongoose.Types.ObjectId(hospitalId),
      status: 'completed'
    });

    // Get appointments by status (all time)
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $match: {
          hospitalId: new mongoose.Types.ObjectId(hospitalId)
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get appointments by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const appointmentsByMonth = await Appointment.aggregate([
      {
        $match: {
          hospitalId: new mongoose.Types.ObjectId(hospitalId),
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get appointments by doctor (all time)
    const appointmentsByDoctor = await Appointment.aggregate([
      {
        $match: {
          hospitalId: new mongoose.Types.ObjectId(hospitalId)
        }
      },
      {
        $group: {
          _id: '$doctorId',
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$consultationFee' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $unwind: '$doctor'
      },
      {
        $project: {
          doctorName: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] },
          specialization: '$doctor.doctorInfo.specialization',
          totalAppointments: 1,
          completedAppointments: 1,
          totalRevenue: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completedAppointments', '$totalAppointments'] },
              100
            ]
          }
        }
      },
      {
        $sort: { totalAppointments: -1 }
      }
    ]);

    // Get revenue analytics
    const revenueAnalytics = await Appointment.aggregate([
      {
        $match: {
          hospitalId: new mongoose.Types.ObjectId(hospitalId)
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$consultationFee' },
          completedRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$consultationFee',
                0
              ]
            }
          },
          pendingRevenue: {
            $sum: {
              $cond: [
                { $in: ['$status', ['confirmed', 'in_progress']] },
                '$consultationFee',
                0
              ]
            }
          }
        }
      }
    ]);

    // Get patient demographics (urgency levels)
    const patientDemographics = await Appointment.aggregate([
      {
        $match: {
          hospitalId: new mongoose.Types.ObjectId(hospitalId)
        }
      },
      {
        $group: {
          _id: '$patientDetails.urgency',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await Appointment.aggregate([
      {
        $match: {
          hospitalId: new mongoose.Types.ObjectId(hospitalId),
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        appointmentsSummary,
        doctorQueues,
        recentAppointments,
        analytics: {
          totalAppointments,
          completedAppointments,
          appointmentsByStatus,
          appointmentsByMonth,
          appointmentsByDoctor,
          revenueAnalytics: revenueAnalytics[0] || {
            totalRevenue: 0,
            completedRevenue: 0,
            pendingRevenue: 0
          },
          patientDemographics,
          recentActivity
        }
      }
    });

  } catch (error) {
    console.error('Get hospital dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
};

// Search hospitals with advanced filters
const searchHospitals = async (req, res) => {
  try {
    const {
      location,
      specialization,
      availability,
      rating,
      distance,
      coordinates
    } = req.query;

    let query = { approvalStatus: 'approved', isActive: true };
    let pipeline = [];

    // Location-based search
    if (location) {
      query.$or = [
        { 'address.city': { $regex: location, $options: 'i' } },
        { 'address.state': { $regex: location, $options: 'i' } }
      ];
    }

    // Rating filter
    if (rating) {
      query['stats.averageRating'] = { $gte: parseFloat(rating) };
    }

    // Base match stage
    pipeline.push({ $match: query });

    // Add current queue count
    pipeline.push({
      $lookup: {
        from: 'appointments',
        let: { hospitalId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$hospitalId', '$$hospitalId'] },
              appointmentDate: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lt: new Date().setHours(23, 59, 59, 999)
              },
              status: { $in: ['confirmed', 'in_progress'] }
            }
          },
          { $count: 'count' }
        ],
        as: 'queueData'
      }
    });

    pipeline.push({
      $addFields: {
        currentQueueCount: {
          $ifNull: [{ $arrayElemAt: ['$queueData.count', 0] }, 0]
        }
      }
    });

    // Availability filter
    if (availability === 'low') {
      pipeline.push({
        $match: { currentQueueCount: { $lt: 10 } }
      });
    } else if (availability === 'medium') {
      pipeline.push({
        $match: { currentQueueCount: { $gte: 10, $lt: 20 } }
      });
    } else if (availability === 'high') {
      pipeline.push({
        $match: { currentQueueCount: { $gte: 20 } }
      });
    }

    // Sort by rating and queue count
    pipeline.push({
      $sort: {
        'stats.averageRating': -1,
        currentQueueCount: 1
      }
    });

    const hospitals = await Hospital.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: { hospitals }
    });

  } catch (error) {
    console.error('Search hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search hospitals',
      error: error.message
    });
  }
};

module.exports = {
  registerHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  getHospitalDashboard,
  searchHospitals
};