/**
 * Large Database Seeder
 * Generates realistic data for production-like testing:
 * - 60+ Hospitals
 * - 500+ Doctors
 * - 10,000+ Patients
 * - 25,000+ Appointments
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
  'City General Hospital', 'Metro Medical Center', 'Central Healthcare', 'Prime Hospital',
  'Apollo Medical Center', 'Fortis Healthcare', 'Max Super Speciality', 'AIIMS Delhi',
  'Manipal Hospital', 'Columbia Asia', 'Narayana Health', 'Aster Medcity',
  'Ruby Hall Clinic', 'Kokilaben Hospital', 'Lilavati Hospital', 'Hinduja Hospital',
  'Breach Candy Hospital', 'Jaslok Hospital', 'Tata Memorial', 'KEM Hospital',
  'Grant Medical College', 'Seth GS Medical', 'Nair Hospital', 'Cooper Hospital',
  'Sion Hospital', 'Cama Hospital', 'JJ Hospital', 'Rajawadi Hospital',
  'Shatabdi Hospital', 'Wockhardt Hospital', 'Global Hospital', 'Medanta Hospital',
  'BLK Super Speciality', 'Sir Ganga Ram', 'Safdarjung Hospital', 'Ram Manohar Lohia',
  'Lady Hardinge', 'Maulana Azad', 'Lok Nayak Hospital', 'GB Pant Hospital',
  'Institute of Liver', 'Gangaram Hospital', 'Max Saket', 'Fortis Escorts',
  'Indraprastha Apollo', 'Artemis Hospital', 'Medicity Gurgaon', 'Paras Hospital',
  'Continental Hospital', 'KIMS Hospital', 'Care Hospital', 'Rainbow Hospital'
];

const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
  'Pimpri', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
  'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
  'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior'
];

const specializations = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Dermatology',
  'Psychiatry', 'Oncology', 'Gastroenterology', 'Pulmonology', 'Nephrology', 'Endocrinology',
  'Rheumatology', 'Ophthalmology', 'ENT', 'Urology', 'General Surgery', 'Plastic Surgery',
  'Emergency Medicine', 'Anesthesiology', 'Radiology', 'Pathology', 'General Medicine'
];

const firstNames = [
  'Rajesh', 'Priya', 'Amit', 'Sunita', 'Vikram', 'Kavita', 'Suresh', 'Meera', 'Ravi', 'Pooja',
  'Anil', 'Deepika', 'Manoj', 'Sita', 'Rohit', 'Neha', 'Ajay', 'Rekha', 'Sanjay', 'Geeta',
  'Ramesh', 'Shanti', 'Vinod', 'Lata', 'Ashok', 'Usha', 'Prakash', 'Sudha', 'Mohan', 'Radha',
  'Dinesh', 'Kamala', 'Naresh', 'Parvati', 'Mahesh', 'Saraswati', 'Yogesh', 'Lakshmi', 'Kiran', 'Anita',
  'Arjun', 'Sushma', 'Nitin', 'Vandana', 'Sachin', 'Nirmala', 'Rahul', 'Seema', 'Arun', 'Madhuri'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Agarwal', 'Jain', 'Patel', 'Shah', 'Mehta',
  'Reddy', 'Nair', 'Iyer', 'Rao', 'Krishnan', 'Pillai', 'Menon', 'Bhat', 'Shetty', 'Kamath',
  'Joshi', 'Desai', 'Thakur', 'Pandey', 'Mishra', 'Tiwari', 'Dubey', 'Shukla', 'Srivastava', 'Tripathi',
  'Banerjee', 'Mukherjee', 'Chatterjee', 'Ghosh', 'Roy', 'Das', 'Sen', 'Bose', 'Dutta', 'Chakraborty'
];

const symptoms = [
  'Fever and headache', 'Chest pain', 'Shortness of breath', 'Abdominal pain', 'Back pain',
  'Joint pain', 'Skin rash', 'Cough and cold', 'Dizziness', 'Fatigue', 'Nausea', 'Vomiting',
  'Diarrhea', 'Constipation', 'Insomnia', 'Anxiety', 'Depression', 'High blood pressure',
  'Diabetes symptoms', 'Thyroid issues', 'Migraine', 'Allergic reactions', 'Wound care',
  'Regular checkup', 'Vaccination', 'Health screening', 'Follow-up consultation'
];

// Utility functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Generate phone number
const generatePhone = () => {
  const prefixes = ['98', '99', '97', '96', '95', '94', '93', '92', '91', '90'];
  return `${getRandomElement(prefixes)}${getRandomNumber(10000000, 99999999)}`;
};

// Generate email
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
  
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const superAdmin = new User({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@onehospital.com',
    password: hashedPassword,
    phone: '9999999999',
    role: 'super_admin',
    isVerified: true
  });
  
  await superAdmin.save();
  console.log('✅ Super Admin created');
  return superAdmin;
};

// Create Hospitals
const createHospitals = async () => {
  console.log('🏥 Creating 60 hospitals...');
  
  const hospitals = [];
  const hashedPassword = await bcrypt.hash('hospital123', 12);
  
  for (let i = 0; i < 60; i++) {
    const hospitalName = `${getRandomElement(hospitalNames)} ${i > 49 ? getRandomElement(cities) : ''}`.trim();
    const city = getRandomElement(cities);
    
    // Create hospital admin user
    const adminUser = new User({
      firstName: `Admin`,
      lastName: `${hospitalName.split(' ')[0]}`,
      email: `admin${i + 1}@${hospitalName.toLowerCase().replace(/\s+/g, '')}.com`,
      password: hashedPassword,
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
        street: `${getRandomNumber(1, 999)} ${getRandomElement(['MG Road', 'Park Street', 'Main Road', 'Station Road', 'Mall Road'])}`,
        city: city,
        state: getRandomElement(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Gujarat', 'Rajasthan']),
        pincode: `${getRandomNumber(100000, 999999)}`
      },
      type: getRandomElement(['government', 'private', 'semi_government']),
      category: getRandomElement(['general', 'specialty', 'super_specialty', 'clinic']),
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
        { name: 'Radiology', description: 'X-ray and imaging services' },
        { name: 'Pharmacy', description: 'In-house pharmacy' },
        { name: 'Blood Bank', description: 'Blood storage and transfusion' },
        { name: 'Ambulance Service', description: 'Emergency transport' }
      ].slice(0, getRandomNumber(4, 8)),
      totalBeds: getRandomNumber(50, 500),
      availableBeds: getRandomNumber(10, 100),
      isApproved: true,
      rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1))
    });
    
    await hospital.save();
    hospitals.push(hospital);
    
    // Update admin user with hospital reference
    adminUser.hospitalId = hospital._id;
    await adminUser.save();
    
    if ((i + 1) % 10 === 0) {
      console.log(`✅ Created ${i + 1} hospitals`);
    }
  }
  
  console.log(`✅ Created ${hospitals.length} hospitals total`);
  return hospitals;
};

// Create Doctors
const createDoctors = async (hospitals) => {
  console.log('👨‍⚕️ Creating 600 doctors...');
  
  const doctors = [];
  const hashedPassword = await bcrypt.hash('doctor123', 12);
  
  for (let i = 0; i < 600; i++) {
    const hospital = getRandomElement(hospitals);
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    
    const doctor = new User({
      firstName: firstName,
      lastName: lastName,
      email: generateEmail(firstName, lastName, 'doctors.com'),
      password: hashedPassword,
      phone: generatePhone(),
      role: 'doctor',
      hospitalId: hospital._id,
      isVerified: true,
      doctorInfo: {
        specialization: getRandomElement(specializations),
        experience: getRandomNumber(1, 30),
        qualification: getRandomElement(['MBBS', 'MBBS, MD', 'MBBS, MS', 'MBBS, DNB', 'MBBS, DM']),
        consultationFee: getRandomNumber(300, 2000),
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
          },
          {
            day: 'Saturday',
            startTime: '09:00',
            endTime: '13:00',
            maxPatients: 15
          }
        ],
        emergencyAvailable: Math.random() > 0.7
      }
    });
    
    await doctor.save();
    doctors.push(doctor);
    
    if ((i + 1) % 50 === 0) {
      console.log(`✅ Created ${i + 1} doctors`);
    }
  }
  
  console.log(`✅ Created ${doctors.length} doctors total`);
  return doctors;
};

// Create Patients
const createPatients = async () => {
  console.log('👥 Creating 12,000 patients...');
  
  const patients = [];
  const hashedPassword = await bcrypt.hash('patient123', 12);
  
  for (let i = 0; i < 12000; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    
    const patient = new User({
      firstName: firstName,
      lastName: lastName,
      email: generateEmail(firstName, lastName),
      password: hashedPassword,
      phone: generatePhone(),
      role: 'patient',
      age: getRandomNumber(1, 80),
      gender: getRandomElement(['male', 'female']),
      isVerified: true
    });
    
    await patient.save();
    patients.push(patient);
    
    if ((i + 1) % 1000 === 0) {
      console.log(`✅ Created ${i + 1} patients`);
    }
  }
  
  console.log(`✅ Created ${patients.length} patients total`);
  return patients;
};

// Create Appointments
const createAppointments = async (hospitals, doctors, patients) => {
  console.log('📅 Creating 30,000 appointments...');
  
  const appointments = [];
  const statuses = ['confirmed', 'completed', 'cancelled', 'missed', 'in_progress'];
  const statusWeights = [0.4, 0.35, 0.15, 0.08, 0.02]; // Probability weights
  
  // Helper function to get weighted random status
  const getWeightedStatus = () => {
    const random = Math.random();
    let sum = 0;
    for (let i = 0; i < statusWeights.length; i++) {
      sum += statusWeights[i];
      if (random <= sum) return statuses[i];
    }
    return 'confirmed';
  };
  
  for (let i = 0; i < 30000; i++) {
    const doctor = getRandomElement(doctors);
    const patient = getRandomElement(patients);
    const hospital = hospitals.find(h => h._id.toString() === doctor.hospitalId.toString());
    
    // Generate appointment date (last 6 months to next 3 months)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    
    const appointmentDate = getRandomDate(startDate, endDate);
    const appointmentTime = getRandomElement(['09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40', '14:00', '14:20', '14:40', '15:00', '15:20', '15:40', '16:00', '16:20', '16:40']);
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
        previousVisit: Math.random() > 0.6,
        allergies: Math.random() > 0.8 ? ['Penicillin'] : [],
        currentMedications: Math.random() > 0.7 ? ['Paracetamol'] : []
      },
      consultationFee: doctor.doctorInfo.consultationFee,
      paymentStatus: getRandomElement(['paid', 'pending']),
      paymentMethod: getRandomElement(['cash', 'card', 'upi', 'online'])
    });
    
    // Add timing information based on status
    if (status === 'completed' || status === 'cancelled' || status === 'missed') {
      appointment.consultationStartedAt = new Date(appointmentDate.getTime() + Math.random() * 60 * 60 * 1000);
      if (status === 'completed') {
        appointment.consultationEndedAt = new Date(appointment.consultationStartedAt.getTime() + getRandomNumber(15, 45) * 60 * 1000);
        appointment.doctorNotes = {
          diagnosis: `${getRandomElement(['Viral fever', 'Hypertension', 'Diabetes', 'Common cold', 'Gastritis', 'Migraine'])}`,
          prescription: [{
            medicine: getRandomElement(['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Omeprazole']),
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '5 days',
            instructions: 'Take after meals'
          }],
          followUpRequired: Math.random() > 0.7,
          additionalNotes: 'Patient advised rest and proper diet'
        };
      }
    } else if (status === 'in_progress') {
      appointment.consultationStartedAt = new Date();
    }
    
    await appointment.save();
    appointments.push(appointment);
    
    if ((i + 1) % 2000 === 0) {
      console.log(`✅ Created ${i + 1} appointments`);
    }
  }
  
  console.log(`✅ Created ${appointments.length} appointments total`);
  return appointments;
};

// Create Ratings
const createRatings = async (appointments) => {
  console.log('⭐ Creating ratings for completed appointments...');
  
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const ratingsToCreate = Math.floor(completedAppointments.length * 0.6); // 60% of completed appointments get ratings
  
  const ratings = [];
  
  for (let i = 0; i < ratingsToCreate; i++) {
    const appointment = completedAppointments[i];
    
    const rating = new Rating({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      hospitalId: appointment.hospitalId,
      doctorId: appointment.doctorId,
      hospitalRating: {
        overall: getRandomNumber(3, 5),
        cleanliness: getRandomNumber(3, 5),
        staff: getRandomNumber(3, 5),
        facilities: getRandomNumber(3, 5),
        waitingTime: getRandomNumber(2, 5)
      },
      doctorRating: {
        overall: getRandomNumber(3, 5),
        behavior: getRandomNumber(3, 5),
        expertise: getRandomNumber(3, 5),
        consultation: getRandomNumber(3, 5),
        followUp: getRandomNumber(3, 5)
      },
      feedback: getRandomElement([
        'Excellent service and care',
        'Very satisfied with the treatment',
        'Good experience overall',
        'Professional and caring staff',
        'Would recommend to others',
        'Quick and efficient service'
      ])
    });
    
    await rating.save();
    ratings.push(rating);
    
    if ((i + 1) % 1000 === 0) {
      console.log(`✅ Created ${i + 1} ratings`);
    }
  }
  
  console.log(`✅ Created ${ratings.length} ratings total`);
  return ratings;
};

// Main seeding function
const seedLargeDatabase = async () => {
  try {
    console.log('🚀 Starting large database seeding...');
    console.log('⚠️ This will take several minutes to complete');
    
    await connectDB();
    await clearDatabase();
    
    const superAdmin = await createSuperAdmin();
    const hospitals = await createHospitals();
    const doctors = await createDoctors(hospitals);
    const patients = await createPatients();
    const appointments = await createAppointments(hospitals, doctors, patients);
    const ratings = await createRatings(appointments);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Final Statistics:');
    console.log(`👑 Super Admins: 1`);
    console.log(`🏥 Hospitals: ${hospitals.length}`);
    console.log(`👨‍⚕️ Doctors: ${doctors.length}`);
    console.log(`👥 Patients: ${patients.length}`);
    console.log(`📅 Appointments: ${appointments.length}`);
    console.log(`⭐ Ratings: ${ratings.length}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('Super Admin: admin@onehospital.com / admin123');
    console.log('Hospital Admins: admin1@citygeneralhospital.com / hospital123 (and similar)');
    console.log('Doctors: [any doctor email] / doctor123');
    console.log('Patients: [any patient email] / patient123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
};

// Run the seeder
seedLargeDatabase();