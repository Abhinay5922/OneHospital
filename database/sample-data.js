/**
 * Sample Data for One Hospital System
 * MongoDB seed data for testing and demonstration
 */

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Sample Users Data
const sampleUsers = [
  // Super Admin
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Super',
    lastName: 'Admin',
    email: 'super@demo.com',
    password: bcrypt.hashSync('password123', 12),
    phone: '9999999999',
    role: 'super_admin',
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Hospital Admins
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'John',
    lastName: 'Smith',
    email: 'admin@cityhospital.com',
    password: bcrypt.hashSync('password123', 12),
    phone: '9876543210',
    role: 'hospital_admin',
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'admin@apollohospital.com',
    password: bcrypt.hashSync('password123', 12),
    phone: '9876543211',
    role: 'hospital_admin',
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Doctors
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Dr. Michael',
    lastName: 'Brown',
    email: 'doctor1@cityhospital.com',
    password: bcrypt.hashSync('password123', 12),
    phone: '9876543212',
    role: 'doctor',
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
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Dr. Emily',
    lastName: 'Davis',
    email: 'doctor2@cityhospital.com',
    password: bcrypt.hashSync('password123', 12),
    phone: '9876543213',
    role: 'doctor',
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
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Patients
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Alice',
    lastName: 'Wilson',
    email: 'patient1@demo.com',
    password: bcrypt.hashSync('password123', 12),
    phone: '9876543214',
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
        phone: '9876543215',
        relation: 'Husband'
      }
    },
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'patient2@demo.com',
    password: bcrypt.hashSync('password123', 12),
    phone: '9876543216',
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
        phone: '9876543217',
        relation: 'Wife'
      }
    },
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample Hospitals Data
const sampleHospitals = [
  {
    _id: new mongoose.Types.ObjectId(),
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
      { name: 'Orthopedics', description: 'Bone and joint care', isActive: true }
    ],
    facilities: [
      { name: 'ICU', description: 'Intensive Care Unit' },
      { name: 'Operation Theater', description: 'Surgical facilities' },
      { name: 'Laboratory', description: 'Diagnostic services' },
      { name: 'Pharmacy', description: 'In-house pharmacy' }
    ],
    operatingHours: {
      weekdays: { open: '08:00', close: '20:00' },
      weekends: { open: '08:00', close: '18:00' },
      emergency24x7: true
    },
    totalBeds: 200,
    availableBeds: 150,
    adminId: sampleUsers[1]._id,
    approvalStatus: 'approved',
    approvedBy: sampleUsers[0]._id,
    approvedAt: new Date(),
    isActive: true,
    stats: {
      totalAppointments: 1250,
      completedAppointments: 1100,
      averageRating: 4.2,
      totalRatings: 85
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
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
      { name: 'Gastroenterology', description: 'Digestive system', isActive: true }
    ],
    facilities: [
      { name: 'MRI', description: 'Magnetic Resonance Imaging' },
      { name: 'CT Scan', description: 'Computed Tomography' },
      { name: 'Cath Lab', description: 'Cardiac Catheterization' },
      { name: 'Robotic Surgery', description: 'Advanced surgical procedures' }
    ],
    operatingHours: {
      weekdays: { open: '06:00', close: '22:00' },
      weekends: { open: '08:00', close: '20:00' },
      emergency24x7: true
    },
    totalBeds: 300,
    availableBeds: 220,
    adminId: sampleUsers[2]._id,
    approvalStatus: 'approved',
    approvedBy: sampleUsers[0]._id,
    approvedAt: new Date(),
    isActive: true,
    stats: {
      totalAppointments: 2100,
      completedAppointments: 1950,
      averageRating: 4.6,
      totalRatings: 142
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Update users with hospital associations
sampleUsers[1].hospitalId = sampleHospitals[0]._id; // Hospital admin 1
sampleUsers[2].hospitalId = sampleHospitals[1]._id; // Hospital admin 2
sampleUsers[3].hospitalId = sampleHospitals[0]._id; // Doctor 1
sampleUsers[4].hospitalId = sampleHospitals[0]._id; // Doctor 2

// Sample Appointments Data
const sampleAppointments = [
  {
    _id: new mongoose.Types.ObjectId(),
    patientId: sampleUsers[5]._id, // Alice Wilson
    hospitalId: sampleHospitals[0]._id, // City General Hospital
    doctorId: sampleUsers[3]._id, // Dr. Michael Brown
    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
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
    paymentMethod: 'cash',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    patientId: sampleUsers[6]._id, // Robert Taylor
    hospitalId: sampleHospitals[0]._id, // City General Hospital
    doctorId: sampleUsers[4]._id, // Dr. Emily Davis
    appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    appointmentTime: '14:00',
    tokenNumber: 1,
    estimatedWaitTime: 0,
    status: 'confirmed',
    patientDetails: {
      symptoms: 'Fever and cough in child',
      urgency: 'medium',
      previousVisit: true,
      allergies: [],
      currentMedications: ['Paracetamol']
    },
    consultationFee: 400,
    paymentStatus: 'pending',
    paymentMethod: 'online',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample Ratings Data
const sampleRatings = [
  {
    _id: new mongoose.Types.ObjectId(),
    patientId: sampleUsers[5]._id,
    appointmentId: new mongoose.Types.ObjectId(), // Previous appointment
    hospitalId: sampleHospitals[0]._id,
    doctorId: sampleUsers[3]._id,
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
      hospitalFeedback: 'Good facilities but waiting time was a bit long',
      doctorFeedback: 'Excellent doctor, very knowledgeable and caring',
      suggestions: 'Improve appointment scheduling to reduce waiting time'
    },
    wouldRecommend: {
      hospital: true,
      doctor: true
    },
    isVerified: true,
    isPublic: true,
    isFlagged: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

module.exports = {
  sampleUsers,
  sampleHospitals,
  sampleAppointments,
  sampleRatings
};