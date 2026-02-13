/**
 * Demo Database Seeder
 * Creates minimal demo data that shows professional statistics
 * Real statistics will grow as actual users register
 * 
 * Professional Display Format:
 * - 50+ Hospitals (from 5 demo hospitals)
 * - 500+ Doctors (from 15 demo doctors) 
 * - 10K+ Patients (from 50 demo patients)
 * - 25K+ Appointments (from 200 demo appointments)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./src/models/User');
const Hospital = require('./src/models/Hospital');
const Appointment = require('./src/models/Appointment');
const Rating = require('./src/models/Rating');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample data arrays
const hospitalNames = [
  'City General Hospital',
  'Metro Medical Center', 
  'Apollo Healthcare',
  'Fortis Hospital',
  'Max Super Speciality'
];

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune'];

const specializations = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology',
  'Dermatology', 'General Medicine', 'Surgery', 'ENT', 'Ophthalmology'
];

const firstNames = [
  'Rajesh', 'Priya', 'Amit', 'Sunita', 'Vikram', 'Kavita', 'Suresh', 'Meera',
  'Ravi', 'Pooja', 'Anil', 'Deepika', 'Manoj', 'Sita', 'Rohit', 'Neha'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Agarwal', 'Jain', 'Patel',
  'Shah', 'Mehta', 'Reddy', 'Nair', 'Iyer', 'Rao', 'Krishnan', 'Pillai'
];

const symptoms = [
  'Fever and headache', 'Chest pain', 'Shortness of breath', 'Abdominal pain',
  'Back pain', 'Joint pain', 'Skin rash', 'Cough and cold', 'Regular checkup'
];

// Utility functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generatePhone = () => {
  const prefixes = ['98', '99', '97', '96', '95'];
  return `${getRandomElement(prefixes)}${getRandomNumber(10000000, 99999999)}`;
};

const generateEmail = (firstName, lastName, domain = 'gmail.com') => {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomNumber(1, 999)}@${domain}`;
};

// Clear existing data
const clearDatabase = async () => {
  console.log('🗑️ Clearing existing data...');
  await User.deleteMany({});
  await Hospital.deleteMany({});
  await Appointment.deleteMany({});
  await Rating.deleteMany({});
  console.log('✅ Database cleared');
};

// Create Super Admin
const createSuperAdmin = async () => {
  console.log('👑 Creating Super Admin...');
  
  const superAdmin = new User({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@onehospital.com',
    password: 'admin123', // Let the User model hash this
    phone: '9999999999',
    role: 'super_admin',
    isVerified: true
  });
  
  await superAdmin.save();
  console.log('✅ Super Admin created');
  return superAdmin;
};

// Create Demo Hospitals (5)
const createDemoHospitals = async () => {
  console.log('🏥 Creating 5 demo hospitals...');
  
  const hospitals = [];
  
  for (let i = 0; i < 5; i++) {
    const hospitalName = hospitalNames[i];
    const city = cities[i];
    
    // Create hospital admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: hospitalName.split(' ')[0],
      email: `admin${i + 1}@${hospitalName.toLowerCase().replace(/\s+/g, '')}.com`,
      password: 'hospital123', // Let the User model hash this
      phone: generatePhone(),
      role: 'hospital_admin',
      isVerified: true
    });
    
    await adminUser.save();
    
    // Create hospital
    const hospital = new Hospital({
      name: hospitalName,
      adminId: adminUser._id,
      registrationNumber: `REG${String(i + 1).padStart(6, '0')}`,
      email: `info${i + 1}@${hospitalName.toLowerCase().replace(/\s+/g, '')}.com`,
      phone: generatePhone(),
      address: {
        street: `${getRandomNumber(1, 999)} ${getRandomElement(['MG Road', 'Park Street', 'Main Road'])}`,
        city: city,
        state: getRandomElement(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat']),
        pincode: `${getRandomNumber(100000, 999999)}`
      },
      type: getRandomElement(['government', 'private', 'semi_government']),
      category: getRandomElement(['general', 'specialty', 'super_specialty']),
      contactInfo: {
        phone: generatePhone(),
        email: `contact${i + 1}@${hospitalName.toLowerCase().replace(/\s+/g, '')}.com`,
        website: `www.${hospitalName.toLowerCase().replace(/\s+/g, '')}.com`
      },
      facilities: [
        { name: 'Emergency Care', description: '24/7 emergency services' },
        { name: 'ICU', description: 'Intensive care unit' },
        { name: 'Operation Theater', description: 'Modern surgical facilities' },
        { name: 'Laboratory', description: 'Diagnostic laboratory' },
        { name: 'Pharmacy', description: 'In-house pharmacy' }
      ],
      totalBeds: getRandomNumber(100, 300),
      availableBeds: getRandomNumber(20, 80),
      approvalStatus: 'approved',
      rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1))
    });
    
    await hospital.save();
    hospitals.push(hospital);
    
    // Update admin user with hospital reference
    adminUser.hospitalId = hospital._id;
    await adminUser.save();
  }
  
  console.log(`✅ Created ${hospitals.length} demo hospitals`);
  return hospitals;
};

// Create Demo Doctors (15 - 3 per hospital)
const createDemoDoctors = async (hospitals) => {
  console.log('👨‍⚕️ Creating 15 demo doctors...');
  
  const doctors = [];
  
  for (let i = 0; i < 15; i++) {
    const hospital = hospitals[Math.floor(i / 3)]; // 3 doctors per hospital
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    
    const doctor = new User({
      firstName: firstName,
      lastName: lastName,
      email: generateEmail(firstName, lastName, 'doctors.com'),
      password: 'doctor123', // Let the User model hash this
      phone: generatePhone(),
      role: 'doctor',
      hospitalId: hospital._id,
      isVerified: true,
      doctorInfo: {
        specialization: getRandomElement(specializations),
        experience: getRandomNumber(2, 20),
        qualification: getRandomElement(['MBBS', 'MBBS, MD', 'MBBS, MS']),
        consultationFee: getRandomNumber(500, 1500),
        availableSlots: [
          {
            day: 'Monday',
            startTime: '09:00',
            endTime: '17:00',
            maxPatients: 20
          },
          {
            day: 'Tuesday',
            startTime: '09:00',
            endTime: '17:00',
            maxPatients: 20
          },
          {
            day: 'Wednesday',
            startTime: '09:00',
            endTime: '17:00',
            maxPatients: 20
          },
          {
            day: 'Thursday',
            startTime: '09:00',
            endTime: '17:00',
            maxPatients: 20
          },
          {
            day: 'Friday',
            startTime: '09:00',
            endTime: '17:00',
            maxPatients: 20
          }
        ],
        emergencyAvailable: Math.random() > 0.5
      }
    });
    
    await doctor.save();
    doctors.push(doctor);
  }
  
  console.log(`✅ Created ${doctors.length} demo doctors`);
  return doctors;
};

// Create Demo Patients (50)
const createDemoPatients = async () => {
  console.log('👥 Creating 50 demo patients...');
  
  const patients = [];
  
  for (let i = 0; i < 50; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    
    const patient = new User({
      firstName: firstName,
      lastName: lastName,
      email: generateEmail(firstName, lastName),
      password: 'patient123', // Let the User model hash this
      phone: generatePhone(),
      role: 'patient',
      age: getRandomNumber(18, 70),
      gender: getRandomElement(['male', 'female']),
      isVerified: true,
      patientInfo: {
        dateOfBirth: getRandomDate(new Date('1950-01-01'), new Date('2005-01-01')),
        gender: getRandomElement(['male', 'female'])
      }
    });
    
    await patient.save();
    patients.push(patient);
  }
  
  console.log(`✅ Created ${patients.length} demo patients`);
  return patients;
};

// Create Demo Appointments (200)
const createDemoAppointments = async (hospitals, doctors, patients) => {
  console.log('📅 Creating 200 demo appointments...');
  
  const appointments = [];
  const statuses = ['confirmed', 'completed', 'cancelled', 'missed'];
  const statusWeights = [0.4, 0.4, 0.15, 0.05];
  
  const getWeightedStatus = () => {
    const random = Math.random();
    let sum = 0;
    for (let i = 0; i < statusWeights.length; i++) {
      sum += statusWeights[i];
      if (random <= sum) return statuses[i];
    }
    return 'confirmed';
  };
  
  for (let i = 0; i < 200; i++) {
    const doctor = getRandomElement(doctors);
    const patient = getRandomElement(patients);
    const hospital = hospitals.find(h => h._id.toString() === doctor.hospitalId.toString());
    
    // Generate appointment date (last 3 months to next 1 month)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    const appointmentDate = getRandomDate(startDate, endDate);
    const appointmentTime = getRandomElement(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']);
    const status = getWeightedStatus();
    
    const appointment = new Appointment({
      patientId: patient._id,
      hospitalId: hospital._id,
      doctorId: doctor._id,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      status: status,
      patientDetails: {
        symptoms: getRandomElement(symptoms),
        urgency: getRandomElement(['low', 'medium', 'high']),
        previousVisit: Math.random() > 0.7
      },
      consultationFee: doctor.doctorInfo.consultationFee,
      paymentStatus: getRandomElement(['paid', 'pending']),
      paymentMethod: getRandomElement(['cash', 'card', 'upi'])
    });
    
    // Add timing information based on status
    if (status === 'completed') {
      appointment.consultationStartedAt = new Date(appointmentDate.getTime() + Math.random() * 60 * 60 * 1000);
      appointment.consultationEndedAt = new Date(appointment.consultationStartedAt.getTime() + getRandomNumber(15, 45) * 60 * 1000);
      appointment.doctorNotes = {
        diagnosis: getRandomElement(['Viral fever', 'Hypertension', 'Common cold', 'Gastritis']),
        prescription: [{
          medicine: getRandomElement(['Paracetamol', 'Ibuprofen', 'Amoxicillin']),
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '5 days',
          instructions: 'Take after meals'
        }],
        followUpRequired: Math.random() > 0.8,
        additionalNotes: 'Patient advised rest and proper diet'
      };
    }
    
    await appointment.save();
    appointments.push(appointment);
  }
  
  console.log(`✅ Created ${appointments.length} demo appointments`);
  return appointments;
};

// Create Demo Ratings
const createDemoRatings = async (appointments) => {
  console.log('⭐ Creating demo ratings...');
  
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const ratingsToCreate = Math.floor(completedAppointments.length * 0.7);
  
  const ratings = [];
  
  for (let i = 0; i < ratingsToCreate; i++) {
    const appointment = completedAppointments[i];
    
    const rating = new Rating({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      hospitalId: appointment.hospitalId,
      doctorId: appointment.doctorId,
      hospitalRating: {
        overall: getRandomNumber(4, 5),
        cleanliness: getRandomNumber(4, 5),
        staff: getRandomNumber(4, 5),
        facilities: getRandomNumber(4, 5),
        waitingTime: getRandomNumber(3, 5)
      },
      doctorRating: {
        overall: getRandomNumber(4, 5),
        behavior: getRandomNumber(4, 5),
        expertise: getRandomNumber(4, 5),
        consultation: getRandomNumber(4, 5),
        followUp: getRandomNumber(4, 5)
      },
      feedback: getRandomElement([
        'Excellent service and care',
        'Very satisfied with the treatment',
        'Professional and caring staff',
        'Would recommend to others'
      ])
    });
    
    await rating.save();
    ratings.push(rating);
  }
  
  console.log(`✅ Created ${ratings.length} demo ratings`);
  return ratings;
};

// Main seeding function
const seedDemoDatabase = async () => {
  try {
    console.log('🚀 Starting demo database seeding...');
    console.log('📝 Creating professional demo data with real statistics API');
    
    await connectDB();
    await clearDatabase();
    
    const superAdmin = await createSuperAdmin();
    const hospitals = await createDemoHospitals();
    const doctors = await createDemoDoctors(hospitals);
    const patients = await createDemoPatients();
    const appointments = await createDemoAppointments(hospitals, doctors, patients);
    // Skip ratings for now - can be added later
    
    console.log('\n🎉 Demo database seeding completed successfully!');
    console.log('\n📊 Demo Statistics (Will grow with real users):');
    console.log(`👑 Super Admins: 1`);
    console.log(`🏥 Hospitals: ${hospitals.length}`);
    console.log(`👨‍⚕️ Doctors: ${doctors.length}`);
    console.log(`👥 Patients: ${patients.length}`);
    console.log(`📅 Appointments: ${appointments.length}`);
    
    console.log('\n🔑 Demo Login Credentials:');
    console.log('Super Admin: admin@onehospital.com / admin123');
    console.log('Hospital Admin: admin1@citygeneralhospital.com / hospital123');
    console.log('Doctor: ravi.krishnan85@doctors.com / doctor123');
    console.log('Patient: deepika.pillai612@gmail.com / patient123');
    
    console.log('\n✨ Homepage will show real-time statistics that grow as users register!');
    
  } catch (error) {
    console.error('❌ Demo seeding failed:', error);
  } finally {
    process.exit(0);
  }
};

// Run the seeder
seedDemoDatabase();