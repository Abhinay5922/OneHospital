/**
 * Database Seeding Script
 * Populates MongoDB with sample data for testing and demonstration
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

// Sample data
const createSampleData = async () => {
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Hospital.deleteMany({});
    await Appointment.deleteMany({});
    await Rating.deleteMany({});

    // Create Super Admin
    console.log('👑 Creating Super Admin...');
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'super@onehospital.com',
      password: 'password123',
      phone: '9999999999',
      role: 'super_admin',
      isActive: true,
      isVerified: true
    });

    // Create Hospital Admins (without hospitalId first)
    console.log('🏥 Creating Hospital Admins...');
    const hospitalAdmin1 = await User.create({
      firstName: 'John',
      lastName: 'Smith',
      email: 'admin@cityhospital.com',
      password: 'password123',
      phone: '9876543210',
      role: 'super_admin', // Temporarily set as super_admin to avoid hospitalId requirement
      isActive: true,
      isVerified: true
    });

    const hospitalAdmin2 = await User.create({
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'admin@apollohospital.com',
      password: 'password123',
      phone: '9876543211',
      role: 'super_admin', // Temporarily set as super_admin to avoid hospitalId requirement
      isActive: true,
      isVerified: true
    });

    // Create Hospitals
    console.log('🏥 Creating Hospitals...');
    const hospital1 = await Hospital.create({
      name: 'City General Hospital',
      registrationNumber: 'CGH001',
      email: 'info@cityhospital.com',
      phone: '9876543220',
      address: {
        street: '123 Hospital Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        coordinates: {
          latitude: 19.0760,
          longitude: 72.8777
        }
      },
      type: 'government',
      category: 'general',
      departments: [
        { name: 'Cardiology', description: 'Heart and cardiovascular care', isActive: true },
        { name: 'Pediatrics', description: 'Child healthcare', isActive: true },
        { name: 'Emergency', description: '24/7 emergency services', isActive: true },
        { name: 'Orthopedics', description: 'Bone and joint care', isActive: true },
        { name: 'General Medicine', description: 'General medical care', isActive: true }
      ],
      facilities: [
        { name: 'ICU', description: 'Intensive Care Unit' },
        { name: 'Operation Theater', description: 'Surgical facilities' },
        { name: 'Laboratory', description: 'Diagnostic services' },
        { name: 'Pharmacy', description: 'In-house pharmacy' },
        { name: 'X-Ray', description: 'Radiology services' }
      ],
      operatingHours: {
        weekdays: { open: '08:00', close: '20:00' },
        weekends: { open: '08:00', close: '18:00' },
        emergency24x7: true
      },
      totalBeds: 200,
      availableBeds: 150,
      adminId: hospitalAdmin1._id,
      approvalStatus: 'approved',
      approvedBy: superAdmin._id,
      approvedAt: new Date(),
      isActive: true,
      stats: {
        totalAppointments: 1250,
        completedAppointments: 1100,
        averageRating: 4.2,
        totalRatings: 85
      }
    });

    const hospital2 = await Hospital.create({
      name: 'Apollo Specialty Hospital',
      registrationNumber: 'ASH002',
      email: 'info@apollohospital.com',
      phone: '9876543221',
      address: {
        street: '456 Medical Center',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        coordinates: {
          latitude: 28.7041,
          longitude: 77.1025
        }
      },
      type: 'private',
      category: 'super_specialty',
      departments: [
        { name: 'Neurology', description: 'Brain and nervous system', isActive: true },
        { name: 'Oncology', description: 'Cancer treatment', isActive: true },
        { name: 'Cardiology', description: 'Heart care', isActive: true },
        { name: 'Gastroenterology', description: 'Digestive system', isActive: true },
        { name: 'Nephrology', description: 'Kidney care', isActive: true }
      ],
      facilities: [
        { name: 'MRI', description: 'Magnetic Resonance Imaging' },
        { name: 'CT Scan', description: 'Computed Tomography' },
        { name: 'Cath Lab', description: 'Cardiac Catheterization' },
        { name: 'Robotic Surgery', description: 'Advanced surgical procedures' },
        { name: 'PET Scan', description: 'Positron Emission Tomography' }
      ],
      operatingHours: {
        weekdays: { open: '06:00', close: '22:00' },
        weekends: { open: '08:00', close: '20:00' },
        emergency24x7: true
      },
      totalBeds: 300,
      availableBeds: 220,
      adminId: hospitalAdmin2._id,
      approvalStatus: 'approved',
      approvedBy: superAdmin._id,
      approvedAt: new Date(),
      isActive: true,
      stats: {
        totalAppointments: 2100,
        completedAppointments: 1950,
        averageRating: 4.6,
        totalRatings: 142
      }
    });

    const hospital3 = await Hospital.create({
      name: 'Max Healthcare Center',
      registrationNumber: 'MHC003',
      email: 'info@maxhealthcare.com',
      phone: '9876543222',
      address: {
        street: '789 Health Street',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        coordinates: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      },
      type: 'private',
      category: 'specialty',
      departments: [
        { name: 'Dermatology', description: 'Skin and hair care', isActive: true },
        { name: 'ENT', description: 'Ear, Nose, and Throat', isActive: true },
        { name: 'Ophthalmology', description: 'Eye care', isActive: true },
        { name: 'Psychiatry', description: 'Mental health', isActive: true }
      ],
      facilities: [
        { name: 'Laser Surgery', description: 'Advanced laser procedures' },
        { name: 'Dialysis', description: 'Kidney dialysis services' },
        { name: 'Physiotherapy', description: 'Physical rehabilitation' }
      ],
      operatingHours: {
        weekdays: { open: '09:00', close: '19:00' },
        weekends: { open: '09:00', close: '17:00' },
        emergency24x7: false
      },
      totalBeds: 150,
      availableBeds: 120,
      adminId: hospitalAdmin1._id, // Reusing admin for demo
      approvalStatus: 'approved',
      approvedBy: superAdmin._id,
      approvedAt: new Date(),
      isActive: true,
      stats: {
        totalAppointments: 800,
        completedAppointments: 720,
        averageRating: 4.1,
        totalRatings: 45
      }
    });

    // Update hospital admins with hospital associations and correct roles
    await User.findByIdAndUpdate(hospitalAdmin1._id, { 
      hospitalId: hospital1._id,
      role: 'hospital_admin'
    });
    await User.findByIdAndUpdate(hospitalAdmin2._id, { 
      hospitalId: hospital2._id,
      role: 'hospital_admin'
    });

    // Create Doctors
    console.log('👨‍⚕️ Creating Doctors...');
    const doctor1 = await User.create({
      firstName: 'Dr. Michael',
      lastName: 'Brown',
      email: 'doctor1@cityhospital.com',
      password: 'password123',
      phone: '9876543212',
      role: 'doctor',
      hospitalId: hospital1._id,
      doctorInfo: {
        specialization: 'Cardiology',
        qualification: 'MD, DM Cardiology',
        experience: 15,
        consultationFee: 500,
        availableSlots: [
          { day: 'Monday', startTime: '09:00', endTime: '17:00', maxPatients: 20 },
          { day: 'Tuesday', startTime: '09:00', endTime: '17:00', maxPatients: 20 },
          { day: 'Wednesday', startTime: '09:00', endTime: '17:00', maxPatients: 20 },
          { day: 'Thursday', startTime: '09:00', endTime: '17:00', maxPatients: 20 },
          { day: 'Friday', startTime: '09:00', endTime: '17:00', maxPatients: 20 }
        ],
        isAvailable: true
      },
      isActive: true,
      isVerified: true
    });

    const doctor2 = await User.create({
      firstName: 'Dr. Emily',
      lastName: 'Davis',
      email: 'doctor2@cityhospital.com',
      password: 'password123',
      phone: '9876543213',
      role: 'doctor',
      hospitalId: hospital1._id,
      doctorInfo: {
        specialization: 'Pediatrics',
        qualification: 'MD Pediatrics',
        experience: 10,
        consultationFee: 400,
        availableSlots: [
          { day: 'Monday', startTime: '10:00', endTime: '18:00', maxPatients: 25 },
          { day: 'Tuesday', startTime: '10:00', endTime: '18:00', maxPatients: 25 },
          { day: 'Wednesday', startTime: '10:00', endTime: '18:00', maxPatients: 25 },
          { day: 'Thursday', startTime: '10:00', endTime: '18:00', maxPatients: 25 },
          { day: 'Saturday', startTime: '10:00', endTime: '16:00', maxPatients: 15 }
        ],
        isAvailable: true
      },
      isActive: true,
      isVerified: true
    });

    const doctor3 = await User.create({
      firstName: 'Dr. Rajesh',
      lastName: 'Kumar',
      email: 'doctor3@apollohospital.com',
      password: 'password123',
      phone: '9876543214',
      role: 'doctor',
      hospitalId: hospital2._id,
      doctorInfo: {
        specialization: 'Neurology',
        qualification: 'MD, DM Neurology',
        experience: 20,
        consultationFee: 800,
        availableSlots: [
          { day: 'Monday', startTime: '08:00', endTime: '16:00', maxPatients: 15 },
          { day: 'Wednesday', startTime: '08:00', endTime: '16:00', maxPatients: 15 },
          { day: 'Friday', startTime: '08:00', endTime: '16:00', maxPatients: 15 }
        ],
        isAvailable: true
      },
      isActive: true,
      isVerified: true
    });

    const doctor4 = await User.create({
      firstName: 'Dr. Priya',
      lastName: 'Sharma',
      email: 'doctor4@apollohospital.com',
      password: 'password123',
      phone: '9876543215',
      role: 'doctor',
      hospitalId: hospital2._id,
      doctorInfo: {
        specialization: 'Oncology',
        qualification: 'MD, DM Oncology',
        experience: 12,
        consultationFee: 700,
        availableSlots: [
          { day: 'Tuesday', startTime: '09:00', endTime: '17:00', maxPatients: 18 },
          { day: 'Thursday', startTime: '09:00', endTime: '17:00', maxPatients: 18 },
          { day: 'Saturday', startTime: '09:00', endTime: '15:00', maxPatients: 12 }
        ],
        isAvailable: true
      },
      isActive: true,
      isVerified: true
    });

    // Create Patients
    console.log('👥 Creating Patients...');
    const patient1 = await User.create({
      firstName: 'Alice',
      lastName: 'Wilson',
      email: 'patient1@demo.com',
      password: 'password123',
      phone: '9876543216',
      role: 'patient',
      patientInfo: {
        dateOfBirth: new Date('1990-05-15'),
        gender: 'female',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        emergencyContact: {
          name: 'Bob Wilson',
          phone: '9876543217',
          relation: 'Husband'
        }
      },
      isActive: true,
      isVerified: true
    });

    const patient2 = await User.create({
      firstName: 'Robert',
      lastName: 'Taylor',
      email: 'patient2@demo.com',
      password: 'password123',
      phone: '9876543218',
      role: 'patient',
      patientInfo: {
        dateOfBirth: new Date('1985-08-22'),
        gender: 'male',
        address: {
          street: '456 Oak Avenue',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        },
        emergencyContact: {
          name: 'Mary Taylor',
          phone: '9876543219',
          relation: 'Wife'
        }
      },
      isActive: true,
      isVerified: true
    });

    const patient3 = await User.create({
      firstName: 'Amit',
      lastName: 'Patel',
      email: 'patient3@demo.com',
      password: 'password123',
      phone: '9876543220',
      role: 'patient',
      patientInfo: {
        dateOfBirth: new Date('1992-12-10'),
        gender: 'male',
        address: {
          street: '789 Tech Park',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        },
        emergencyContact: {
          name: 'Sunita Patel',
          phone: '9876543221',
          relation: 'Mother'
        }
      },
      isActive: true,
      isVerified: true
    });

    // Create Sample Appointments
    console.log('📅 Creating Sample Appointments...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const appointment1 = await Appointment.create({
      patientId: patient1._id,
      hospitalId: hospital1._id,
      doctorId: doctor1._id,
      appointmentDate: tomorrow,
      appointmentTime: '10:00',
      tokenNumber: 1,
      estimatedWaitTime: 0,
      status: 'confirmed',
      patientDetails: {
        symptoms: 'Chest pain and shortness of breath',
        urgency: 'high',
        previousVisit: false,
        allergies: ['Penicillin'],
        currentMedications: ['Aspirin']
      },
      consultationFee: 500,
      paymentStatus: 'pending',
      paymentMethod: 'cash'
    });

    const appointment2 = await Appointment.create({
      patientId: patient2._id,
      hospitalId: hospital1._id,
      doctorId: doctor2._id,
      appointmentDate: dayAfterTomorrow,
      appointmentTime: '14:00',
      tokenNumber: 1,
      estimatedWaitTime: 0,
      status: 'confirmed',
      patientDetails: {
        symptoms: 'Child has fever and cough for 3 days',
        urgency: 'medium',
        previousVisit: true,
        allergies: [],
        currentMedications: ['Paracetamol']
      },
      consultationFee: 400,
      paymentStatus: 'pending',
      paymentMethod: 'online'
    });

    const appointment3 = await Appointment.create({
      patientId: patient3._id,
      hospitalId: hospital2._id,
      doctorId: doctor3._id,
      appointmentDate: tomorrow,
      appointmentTime: '11:00',
      tokenNumber: 1,
      estimatedWaitTime: 0,
      status: 'confirmed',
      patientDetails: {
        symptoms: 'Frequent headaches and dizziness',
        urgency: 'medium',
        previousVisit: false,
        allergies: ['Sulfa drugs'],
        currentMedications: []
      },
      consultationFee: 800,
      paymentStatus: 'paid',
      paymentMethod: 'card'
    });

    // Create completed appointment for rating
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const completedAppointment = await Appointment.create({
      patientId: patient1._id,
      hospitalId: hospital1._id,
      doctorId: doctor1._id,
      appointmentDate: pastDate,
      appointmentTime: '15:00',
      tokenNumber: 5,
      status: 'completed',
      patientDetails: {
        symptoms: 'Regular checkup',
        urgency: 'low',
        previousVisit: true,
        allergies: [],
        currentMedications: []
      },
      consultationFee: 500,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      consultationStartedAt: new Date(pastDate.getTime() + 15 * 60000), // 15 minutes later
      consultationEndedAt: new Date(pastDate.getTime() + 45 * 60000), // 45 minutes later
      doctorNotes: {
        diagnosis: 'Normal health checkup - all parameters normal',
        prescription: [
          {
            medicine: 'Vitamin D3',
            dosage: '1000 IU',
            frequency: 'Once daily',
            duration: '30 days',
            instructions: 'Take with food'
          }
        ],
        followUpRequired: false,
        additionalNotes: 'Patient is in good health. Continue regular exercise and balanced diet.'
      }
    });

    // Create Sample Rating
    console.log('⭐ Creating Sample Ratings...');
    await Rating.create({
      patientId: patient1._id,
      appointmentId: completedAppointment._id,
      hospitalId: hospital1._id,
      doctorId: doctor1._id,
      hospitalRating: 4,
      doctorRating: 5,
      ratingDetails: {
        hospitalCleanliness: 4,
        hospitalStaff: 4,
        hospitalFacilities: 4,
        waitingTime: 3,
        doctorBehavior: 5,
        doctorExpertise: 5,
        consultationQuality: 5,
        followUpCare: 4
      },
      feedback: {
        hospitalFeedback: 'Good facilities and clean environment. Staff was helpful but waiting time was a bit long.',
        doctorFeedback: 'Excellent doctor! Very knowledgeable, patient, and caring. Explained everything clearly.',
        suggestions: 'Improve appointment scheduling to reduce waiting time'
      },
      wouldRecommend: {
        hospital: true,
        doctor: true
      },
      isVerified: true,
      isPublic: true,
      isFlagged: false
    });

    console.log('✅ Sample data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`👑 Super Admins: 1`);
    console.log(`🏥 Hospital Admins: 2`);
    console.log(`👨‍⚕️ Doctors: 4`);
    console.log(`👥 Patients: 3`);
    console.log(`🏥 Hospitals: 3`);
    console.log(`📅 Appointments: 4`);
    console.log(`⭐ Ratings: 1`);

    console.log('\n🔐 Demo Login Credentials:');
    console.log('Super Admin: super@onehospital.com / password123');
    console.log('Hospital Admin: admin@cityhospital.com / password123');
    console.log('Doctor: doctor1@cityhospital.com / password123');
    console.log('Patient: patient1@demo.com / password123');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
};

// Main function
const seedDatabase = async () => {
  try {
    await connectDB();
    await createSampleData();
    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run the seeding script
seedDatabase();