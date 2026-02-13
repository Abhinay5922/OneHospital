# One Hospital - Database Schema

## MongoDB Collections

### 1. Users Collection
Stores all user types: Super Admin, Hospital Admin, Doctor, Patient

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (enum: ['super_admin', 'hospital_admin', 'doctor', 'patient']),
  hospitalId: ObjectId (ref: Hospital),
  
  // Doctor-specific information
  doctorInfo: {
    specialization: String,
    qualification: String,
    experience: Number,
    consultationFee: Number,
    availableSlots: [{
      day: String,
      startTime: String,
      endTime: String,
      maxPatients: Number
    }],
    isAvailable: Boolean
  },
  
  // Patient-specific information
  patientInfo: {
    dateOfBirth: Date,
    gender: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    }
  },
  
  isActive: Boolean,
  isVerified: Boolean,
  lastLogin: Date,
  profileImage: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Hospitals Collection
Stores hospital information and operational details

```javascript
{
  _id: ObjectId,
  name: String,
  registrationNumber: String (unique),
  email: String (unique),
  phone: String,
  
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  type: String (enum: ['government', 'private', 'semi_government']),
  category: String (enum: ['general', 'specialty', 'super_specialty', 'clinic']),
  
  departments: [{
    name: String,
    description: String,
    isActive: Boolean
  }],
  
  facilities: [{
    name: String,
    description: String
  }],
  
  operatingHours: {
    weekdays: {
      open: String,
      close: String
    },
    weekends: {
      open: String,
      close: String
    },
    emergency24x7: Boolean
  },
  
  totalBeds: Number,
  availableBeds: Number,
  adminId: ObjectId (ref: User),
  
  approvalStatus: String (enum: ['pending', 'approved', 'rejected']),
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  rejectionReason: String,
  
  isActive: Boolean,
  images: [{
    url: String,
    caption: String
  }],
  logo: String,
  
  stats: {
    totalAppointments: Number,
    completedAppointments: Number,
    averageRating: Number,
    totalRatings: Number
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Appointments Collection
Manages patient appointments and queue system

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: User),
  hospitalId: ObjectId (ref: Hospital),
  doctorId: ObjectId (ref: User),
  
  appointmentDate: Date,
  appointmentTime: String,
  tokenNumber: Number,
  estimatedWaitTime: Number,
  
  status: String (enum: ['confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  
  patientDetails: {
    symptoms: String,
    urgency: String (enum: ['low', 'medium', 'high', 'emergency']),
    previousVisit: Boolean,
    allergies: [String],
    currentMedications: [String]
  },
  
  doctorNotes: {
    diagnosis: String,
    prescription: [{
      medicine: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    followUpRequired: Boolean,
    followUpDate: Date,
    additionalNotes: String
  },
  
  checkedInAt: Date,
  consultationStartedAt: Date,
  consultationEndedAt: Date,
  
  consultationFee: Number,
  paymentStatus: String (enum: ['pending', 'paid', 'refunded']),
  paymentMethod: String (enum: ['cash', 'card', 'upi', 'online']),
  
  cancellationReason: String,
  cancelledBy: String,
  cancelledAt: Date,
  
  rating: {
    doctorRating: Number,
    hospitalRating: Number,
    feedback: String,
    ratedAt: Date
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Ratings Collection
Stores patient ratings and feedback

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: User),
  appointmentId: ObjectId (ref: Appointment),
  hospitalId: ObjectId (ref: Hospital),
  doctorId: ObjectId (ref: User),
  
  hospitalRating: Number (1-5),
  doctorRating: Number (1-5),
  
  ratingDetails: {
    hospitalCleanliness: Number,
    hospitalStaff: Number,
    hospitalFacilities: Number,
    waitingTime: Number,
    doctorBehavior: Number,
    doctorExpertise: Number,
    consultationQuality: Number,
    followUpCare: Number
  },
  
  feedback: {
    hospitalFeedback: String,
    doctorFeedback: String,
    suggestions: String
  },
  
  wouldRecommend: {
    hospital: Boolean,
    doctor: Boolean
  },
  
  isVerified: Boolean,
  isPublic: Boolean,
  isFlagged: Boolean,
  flagReason: String,
  moderatedBy: ObjectId (ref: User),
  moderatedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

### Users Collection
- `{ email: 1 }` - Unique index for email
- `{ role: 1 }` - Index for role-based queries
- `{ hospitalId: 1 }` - Index for hospital association

### Hospitals Collection
- `{ "address.city": 1 }` - Index for city-based search
- `{ "address.state": 1 }` - Index for state-based search
- `{ type: 1 }` - Index for hospital type
- `{ category: 1 }` - Index for hospital category
- `{ approvalStatus: 1 }` - Index for approval status
- `{ "stats.averageRating": -1 }` - Index for rating-based sorting

### Appointments Collection
- `{ patientId: 1, appointmentDate: -1 }` - Index for patient appointments
- `{ doctorId: 1, appointmentDate: 1 }` - Index for doctor appointments
- `{ hospitalId: 1, appointmentDate: 1 }` - Index for hospital appointments
- `{ status: 1 }` - Index for status-based queries
- `{ doctorId: 1, appointmentDate: 1, status: 1, tokenNumber: 1 }` - Compound index for queue management

### Ratings Collection
- `{ hospitalId: 1, createdAt: -1 }` - Index for hospital ratings
- `{ doctorId: 1, createdAt: -1 }` - Index for doctor ratings
- `{ appointmentId: 1 }` - Unique index for one rating per appointment
- `{ hospitalId: 1, isPublic: 1, isFlagged: 1, createdAt: -1 }` - Compound index for public ratings

## Relationships

1. **User → Hospital**: Many-to-One (hospitalId)
2. **Hospital → User**: One-to-Many (adminId, doctors)
3. **Appointment → User**: Many-to-One (patientId, doctorId)
4. **Appointment → Hospital**: Many-to-One (hospitalId)
5. **Rating → User**: Many-to-One (patientId)
6. **Rating → Appointment**: One-to-One (appointmentId)
7. **Rating → Hospital**: Many-to-One (hospitalId)
8. **Rating → Doctor**: Many-to-One (doctorId)

## Data Validation Rules

1. **Email uniqueness** across all users
2. **Hospital registration number uniqueness**
3. **One rating per appointment** (unique constraint)
4. **Role-based field requirements** (doctorInfo for doctors, patientInfo for patients)
5. **Date validations** (appointment date cannot be in past)
6. **Rating range validation** (1-5 scale)
7. **Phone number format validation** (10 digits)
8. **Pincode format validation** (6 digits)