/**
 * Check All Appointments in Database
 * Direct MongoDB query to see all appointments
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './backend/.env' });

// Import models
const Appointment = require('./backend/src/models/Appointment');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

async function checkAllAppointments() {
  console.log('🔍 Checking All Appointments in Database');
  console.log('========================================\n');

  try {
    await connectDB();

    // Get all appointments for Apollo Hospital
    const apolloHospitalId = '69764c26e5f92054a4f80aa7';
    
    const allAppointments = await Appointment.find({
      hospitalId: apolloHospitalId
    })
    .populate('patientId', 'firstName lastName phone')
    .populate('doctorId', 'firstName lastName doctorInfo.specialization')
    .populate('hospitalId', 'name')
    .sort({ createdAt: -1 });

    console.log(`📊 Total Appointments Found: ${allAppointments.length}\n`);

    if (allAppointments.length > 0) {
      console.log('📋 All Appointments:');
      allAppointments.forEach((appointment, index) => {
        console.log(`${index + 1}. ID: ${appointment._id}`);
        console.log(`   Token #${appointment.tokenNumber} - ${appointment.patientId?.firstName} ${appointment.patientId?.lastName}`);
        console.log(`   Doctor: ${appointment.doctorId?.firstName} ${appointment.doctorId?.lastName}`);
        console.log(`   Hospital: ${appointment.hospitalId?.name}`);
        console.log(`   Date: ${appointment.appointmentDate}`);
        console.log(`   Time: ${appointment.appointmentTime}`);
        console.log(`   Status: ${appointment.status}`);
        console.log(`   Created: ${appointment.createdAt}`);
        console.log(`   Symptoms: ${appointment.patientDetails?.symptoms}`);
        console.log('');
      });
    } else {
      console.log('❌ No appointments found for Apollo Hospital');
    }

    // Also check appointments for all hospitals
    console.log('\n🏥 Checking appointments for ALL hospitals:');
    const allHospitalAppointments = await Appointment.find({})
    .populate('patientId', 'firstName lastName')
    .populate('doctorId', 'firstName lastName')
    .populate('hospitalId', 'name')
    .sort({ createdAt: -1 });

    console.log(`📊 Total Appointments (All Hospitals): ${allHospitalAppointments.length}\n`);

    if (allHospitalAppointments.length > 0) {
      allHospitalAppointments.forEach((appointment, index) => {
        console.log(`${index + 1}. ${appointment.hospitalId?.name} - Token #${appointment.tokenNumber}`);
        console.log(`   Patient: ${appointment.patientId?.firstName} ${appointment.patientId?.lastName}`);
        console.log(`   Doctor: ${appointment.doctorId?.firstName} ${appointment.doctorId?.lastName}`);
        console.log(`   Date: ${appointment.appointmentDate}`);
        console.log(`   Created: ${appointment.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkAllAppointments().catch(console.error);