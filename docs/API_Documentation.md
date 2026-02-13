# One Hospital - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": boolean,
  "message": string,
  "data": object,
  "errors": array (optional)
}
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": "patient",
  "hospitalId": "hospital_id" (required for hospital_admin and doctor),
  "doctorInfo": {
    "specialization": "Cardiology",
    "qualification": "MD",
    "experience": 10,
    "consultationFee": 500,
    "availableSlots": [...]
  },
  "patientInfo": {
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "address": {...},
    "emergencyContact": {...}
  }
}
```

### POST /auth/login
User login

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### GET /auth/profile
Get current user profile (Protected)

### PUT /auth/profile
Update user profile (Protected)

### PUT /auth/change-password
Change user password (Protected)

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

---

## Hospital Endpoints

### GET /hospitals
Get all hospitals with filters

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `city`: Filter by city
- `state`: Filter by state
- `type`: Filter by hospital type
- `category`: Filter by category
- `sortBy`: Sort field (default: stats.averageRating)
- `sortOrder`: Sort order (asc/desc, default: desc)

### GET /hospitals/search
Advanced hospital search

**Query Parameters:**
- `location`: Location search
- `specialization`: Doctor specialization
- `availability`: Queue availability (low/medium/high)
- `rating`: Minimum rating
- `distance`: Distance filter
- `coordinates`: User coordinates

### GET /hospitals/:hospitalId
Get hospital details by ID

### POST /hospitals
Register new hospital (Hospital Admin only)

**Request Body:**
```json
{
  "name": "City Hospital",
  "registrationNumber": "CH001",
  "email": "info@cityhospital.com",
  "phone": "9876543210",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "type": "private",
  "category": "general",
  "totalBeds": 100,
  "departments": [...],
  "facilities": [...]
}
```

### PUT /hospitals/:hospitalId
Update hospital (Hospital Admin/Super Admin only)

### GET /hospitals/:hospitalId/dashboard
Get hospital dashboard data (Hospital Admin/Super Admin only)

---

## Doctor Endpoints

### GET /doctors/hospital/:hospitalId
Get doctors by hospital

### PUT /doctors/availability
Update doctor availability (Doctor only)

**Request Body:**
```json
{
  "isAvailable": true,
  "availableSlots": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "17:00",
      "maxPatients": 20
    }
  ]
}
```

---

## Appointment Endpoints

### POST /appointments
Book new appointment (Patient only)

**Request Body:**
```json
{
  "hospitalId": "hospital_id",
  "doctorId": "doctor_id",
  "appointmentDate": "2025-01-26",
  "appointmentTime": "10:00",
  "patientDetails": {
    "symptoms": "Chest pain",
    "urgency": "high",
    "previousVisit": false,
    "allergies": ["Penicillin"],
    "currentMedications": ["Aspirin"]
  }
}
```

### GET /appointments/patient
Get patient appointments (Patient only)

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status

### GET /appointments/doctor
Get doctor appointments (Doctor only)

**Query Parameters:**
- `date`: Appointment date (default: today)
- `status`: Filter by status

### GET /appointments/:appointmentId
Get appointment details

### PUT /appointments/:appointmentId/status
Update appointment status (Doctor/Hospital Admin only)

**Request Body:**
```json
{
  "status": "in_progress",
  "doctorNotes": {
    "diagnosis": "Hypertension",
    "prescription": [...],
    "followUpRequired": true,
    "additionalNotes": "..."
  }
}
```

### PUT /appointments/:appointmentId/cancel
Cancel appointment

**Request Body:**
```json
{
  "reason": "Patient unavailable"
}
```

---

## Queue Endpoints

### GET /queue/doctor/:doctorId
Get current queue for doctor

**Query Parameters:**
- `date`: Queue date (default: today)

### GET /queue/hospital/:hospitalId
Get hospital queue summary

**Query Parameters:**
- `date`: Queue date (default: today)

---

## Rating Endpoints

### POST /ratings
Submit rating (Patient only)

**Request Body:**
```json
{
  "appointmentId": "appointment_id",
  "hospitalId": "hospital_id",
  "doctorId": "doctor_id",
  "hospitalRating": 4,
  "doctorRating": 5,
  "ratingDetails": {
    "hospitalCleanliness": 4,
    "hospitalStaff": 4,
    "waitingTime": 3,
    "doctorBehavior": 5,
    "doctorExpertise": 5
  },
  "feedback": {
    "hospitalFeedback": "Good facilities",
    "doctorFeedback": "Excellent doctor"
  },
  "wouldRecommend": {
    "hospital": true,
    "doctor": true
  }
}
```

### GET /ratings/hospital/:hospitalId
Get hospital ratings and reviews

---

## Admin Endpoints (Super Admin only)

### GET /admin/hospitals/pending
Get pending hospital approvals

### PUT /admin/hospitals/:hospitalId/approval
Approve/reject hospital

**Request Body:**
```json
{
  "status": "approved",
  "rejectionReason": "Incomplete documentation" (if rejected)
}
```

### GET /admin/stats
Get platform statistics

---

## WebSocket Events

### Client Events
- `join-hospital`: Join hospital room for updates
- `join-doctor`: Join doctor room for updates

### Server Events
- `new-appointment`: New appointment booked
- `appointment-updated`: Appointment status changed
- `appointment-cancelled`: Appointment cancelled
- `queue-updated`: Queue status updated

---

## Error Codes

- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `422`: Validation Error - Input validation failed
- `500`: Internal Server Error - Server error

---

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute
- Search endpoints: 50 requests per minute

---

## Data Validation

### User Registration
- Email: Valid email format, unique
- Password: Minimum 6 characters, must contain uppercase, lowercase, and number
- Phone: 10-digit number
- Role: Must be one of allowed roles

### Hospital Registration
- Registration number: Unique
- Email: Valid email format, unique
- Phone: 10-digit number
- Pincode: 6-digit number
- Total beds: Minimum 1

### Appointment Booking
- Date: Cannot be in the past, maximum 30 days in future
- Time: Valid HH:MM format
- Symptoms: Minimum 10 characters, maximum 500 characters

### Rating Submission
- Ratings: Integer between 1 and 5
- Feedback: Maximum 500 characters per field
- One rating per appointment (unique constraint)