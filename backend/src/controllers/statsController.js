/**
 * Statistics Controller
 * Handles fetching platform statistics with professional formatting
 */

const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');

// Format numbers for professional display
const formatStatNumber = (count) => {
  // Show real numbers - no artificial inflation
  if (count >= 25000) {
    return `${Math.floor(count / 1000)}K+`;
  } else if (count >= 10000) {
    return `${Math.floor(count / 1000)}K+`;
  } else if (count >= 1000) {
    return `${Math.floor(count / 1000)}K+`;
  } else if (count >= 500) {
    return `500+`;
  } else if (count >= 50) {
    return `50+`;
  } else if (count >= 25) {
    return `25+`;
  } else if (count >= 10) {
    return `10+`;
  } else if (count >= 5) {
    return `5+`;
  } else {
    return count.toString(); // Show exact count for small numbers
  }
};

// Get platform statistics
const getPlatformStats = async (req, res) => {
  try {
    console.log('📊 Fetching platform statistics...');

    // Get counts in parallel for better performance
    const [
      hospitalCount,
      doctorCount,
      patientCount,
      appointmentCount
    ] = await Promise.all([
      Hospital.countDocuments({ approvalStatus: 'approved' }),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments({})
    ]);

    const stats = {
      hospitals: {
        count: hospitalCount,
        display: formatStatNumber(hospitalCount)
      },
      doctors: {
        count: doctorCount,
        display: formatStatNumber(doctorCount)
      },
      patients: {
        count: patientCount,
        display: formatStatNumber(patientCount)
      },
      appointments: {
        count: appointmentCount,
        display: formatStatNumber(appointmentCount)
      }
    };

    console.log('✅ Platform statistics:', {
      hospitals: `${hospitalCount} (${stats.hospitals.display})`,
      doctors: `${doctorCount} (${stats.doctors.display})`,
      patients: `${patientCount} (${stats.patients.display})`,
      appointments: `${appointmentCount} (${stats.appointments.display})`
    });

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error fetching platform statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform statistics',
      error: error.message
    });
  }
};

module.exports = {
  getPlatformStats
};