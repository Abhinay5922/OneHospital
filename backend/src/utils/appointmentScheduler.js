/**
 * Appointment Scheduler Utility
 * Handles automatic appointment status updates based on time
 */

const Appointment = require('../models/Appointment');
const moment = require('moment');

/**
 * Convert appointment time string to minutes since midnight
 * @param {string} timeString - Time in format "HH:MM AM/PM" or "HH:MM"
 * @returns {number} Minutes since midnight
 */
function timeStringToMinutes(timeString) {
  // Handle both 12-hour and 24-hour formats
  let time = timeString.toLowerCase().trim();
  
  // Convert 12-hour format to 24-hour format
  if (time.includes('am') || time.includes('pm')) {
    const isPM = time.includes('pm');
    time = time.replace(/\s*(am|pm)/g, '');
    
    let [hours, minutes] = time.split(':').map(Number);
    
    if (isPM && hours !== 12) {
      hours += 12;
    } else if (!isPM && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  } else {
    // 24-hour format
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

/**
 * Check if an appointment time has passed by more than 10 minutes
 * @param {Date} appointmentDate - The appointment date
 * @param {string} appointmentTime - The appointment time string
 * @returns {boolean} True if appointment is missed (past by 10+ minutes)
 */
function isAppointmentMissed(appointmentDate, appointmentTime) {
  const now = new Date();
  const appointmentDateTime = new Date(appointmentDate);
  
  // If appointment is not today, check if it's in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  appointmentDateTime.setHours(0, 0, 0, 0);
  
  if (appointmentDateTime < today) {
    return true; // Past date
  } else if (appointmentDateTime > today) {
    return false; // Future date
  }
  
  // Same day - check time
  const appointmentMinutes = timeStringToMinutes(appointmentTime);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Check if current time is more than 10 minutes past appointment time
  return currentMinutes > (appointmentMinutes + 10);
}

/**
 * Update missed appointments
 * Finds confirmed appointments that are past their time + 10 minutes and marks them as missed
 */
async function updateMissedAppointments() {
  try {
    console.log('🕐 Checking for missed appointments...');
    
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Find all confirmed appointments for today and past dates
    const appointments = await Appointment.find({
      status: 'confirmed',
      appointmentDate: { $lte: endOfDay }
    }).populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName');
    
    let missedCount = 0;
    const missedAppointments = [];
    
    for (const appointment of appointments) {
      if (isAppointmentMissed(appointment.appointmentDate, appointment.appointmentTime)) {
        // Update status to missed
        appointment.status = 'missed';
        appointment.cancelledAt = new Date();
        appointment.cancelledBy = 'system';
        appointment.cancellationReason = 'Appointment time passed (auto-marked as missed)';
        
        await appointment.save();
        
        missedCount++;
        missedAppointments.push({
          id: appointment._id,
          doctorId: appointment.doctorId._id,
          hospitalId: appointment.hospitalId,
          patient: `${appointment.patientId?.firstName} ${appointment.patientId?.lastName}`,
          doctor: `${appointment.doctorId?.firstName} ${appointment.doctorId?.lastName}`,
          date: appointment.appointmentDate.toDateString(),
          time: appointment.appointmentTime
        });
        
        console.log(`📅 Marked appointment as missed: ${appointment.patientId?.firstName} ${appointment.patientId?.lastName} - ${appointment.appointmentTime}`);
      }
    }
    
    if (missedCount > 0) {
      console.log(`✅ Updated ${missedCount} missed appointments`);
      
      // Emit socket events for real-time updates (if io is available)
      if (global.io) {
        missedAppointments.forEach(apt => {
          // Emit to doctor room
          global.io.to(`doctor-${apt.doctorId}`).emit('appointment-missed', {
            appointmentId: apt.id,
            message: 'Appointment marked as missed',
            appointment: apt
          });
          
          // Emit to hospital room
          global.io.to(`hospital-${apt.hospitalId}`).emit('appointment-missed', {
            appointmentId: apt.id,
            message: 'Appointment marked as missed',
            appointment: apt
          });
          
          console.log(`📡 Emitted missed appointment event for appointment ${apt.id}`);
        });
      }
    } else {
      console.log('✅ No missed appointments found');
    }
    
    return { missedCount, missedAppointments };
    
  } catch (error) {
    console.error('❌ Error updating missed appointments:', error);
    throw error;
  }
}

/**
 * Start the appointment scheduler
 * Runs every 5 minutes to check for missed appointments
 */
function startAppointmentScheduler() {
  console.log('🚀 Starting appointment scheduler...');
  
  // Run immediately on startup
  updateMissedAppointments().catch(console.error);
  
  // Then run every 5 minutes
  const interval = setInterval(() => {
    updateMissedAppointments().catch(console.error);
  }, 5 * 60 * 1000); // 5 minutes
  
  console.log('⏰ Appointment scheduler started - checking every 5 minutes');
  
  return interval;
}

/**
 * Stop the appointment scheduler
 */
function stopAppointmentScheduler(interval) {
  if (interval) {
    clearInterval(interval);
    console.log('⏹️ Appointment scheduler stopped');
  }
}

/**
 * Manual check for missed appointments (for testing)
 */
async function checkMissedAppointmentsNow() {
  console.log('🔍 Manual check for missed appointments...');
  return await updateMissedAppointments();
}

module.exports = {
  startAppointmentScheduler,
  stopAppointmentScheduler,
  updateMissedAppointments,
  checkMissedAppointmentsNow,
  isAppointmentMissed,
  timeStringToMinutes
};