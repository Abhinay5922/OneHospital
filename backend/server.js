/**
 * One Hospital - Main Server File
 * Final Year MCA Project
 * 
 * This file initializes the Express server, connects to MongoDB,
 * sets up middleware, routes, and Socket.IO for real-time features.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./src/config/database');
const { startAppointmentScheduler } = require('./src/utils/appointmentScheduler');

// Load environment variables
dotenv.config();

// Import routes with error handling
let authRoutes, hospitalRoutes, doctorRoutes, appointmentRoutes, queueRoutes, ratingRoutes, adminRoutes, emergencyRoutes, schedulerRoutes, statsRoutes, referralRoutes;

try {
  authRoutes = require('./src/routes/authRoutes');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

try {
  hospitalRoutes = require('./src/routes/hospitalRoutes');
  console.log('✅ Hospital routes loaded');
} catch (error) {
  console.error('❌ Error loading hospital routes:', error.message);
}

try {
  doctorRoutes = require('./src/routes/doctorRoutes');
  console.log('✅ Doctor routes loaded');
} catch (error) {
  console.error('❌ Error loading doctor routes:', error.message);
}

try {
  appointmentRoutes = require('./src/routes/appointmentRoutes');
  console.log('✅ Appointment routes loaded');
} catch (error) {
  console.error('❌ Error loading appointment routes:', error.message);
}

try {
  queueRoutes = require('./src/routes/queueRoutes');
  console.log('✅ Queue routes loaded');
} catch (error) {
  console.error('❌ Error loading queue routes:', error.message);
}

try {
  ratingRoutes = require('./src/routes/ratingRoutes');
  console.log('✅ Rating routes loaded');
} catch (error) {
  console.error('❌ Error loading rating routes:', error.message);
}

try {
  adminRoutes = require('./src/routes/adminRoutes');
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.error('❌ Error loading admin routes:', error.message);
}

try {
  emergencyRoutes = require('./src/routes/emergencyRoutes');
  console.log('✅ Emergency routes loaded');
} catch (error) {
  console.error('❌ Error loading emergency routes:', error.message);
}

try {
  schedulerRoutes = require('./src/routes/appointmentSchedulerRoutes');
  console.log('✅ Scheduler routes loaded');
} catch (error) {
  console.error('❌ Error loading scheduler routes:', error.message);
}

try {
  statsRoutes = require('./src/routes/statsRoutes');
  console.log('✅ Stats routes loaded');
} catch (error) {
  console.error('❌ Error loading stats routes:', error.message);
}

try {
  referralRoutes = require('./src/routes/referralRoutes');
  console.log('✅ Referral routes loaded');
} catch (error) {
  console.error('❌ Error loading referral routes:', error.message);
}

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const { authenticateToken } = require('./src/middleware/auth');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Production security and optimization middleware
app.use(helmet()); // Set security HTTP headers
app.use(compression()); // Compress all responses

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all API routes
app.use('/api/', limiter);

// Logging in production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io globally available for background jobs
global.io = io;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes with logging
app.use('/api/auth', (req, res, next) => {
  console.log(`Auth route: ${req.method} ${req.path}`);
  next();
}, authRoutes);

app.use('/api/hospitals', (req, res, next) => {
  console.log(`Hospital route: ${req.method} ${req.path}`);
  next();
}, hospitalRoutes);

app.use('/api/doctors', (req, res, next) => {
  console.log(`Doctor route: ${req.method} ${req.path}`);
  next();
}, doctorRoutes);

app.use('/api/appointments', (req, res, next) => {
  console.log(`Appointment route: ${req.method} ${req.path}`);
  next();
}, appointmentRoutes);

app.use('/api/queue', (req, res, next) => {
  console.log(`Queue route: ${req.method} ${req.path}`);
  next();
}, queueRoutes);

app.use('/api/ratings', (req, res, next) => {
  console.log(`Rating route: ${req.method} ${req.path}`);
  next();
}, ratingRoutes);

app.use('/api/admin', (req, res, next) => {
  console.log(`Admin route: ${req.method} ${req.path}`);
  next();
}, adminRoutes);

app.use('/api/emergency', (req, res, next) => {
  console.log(`Emergency route: ${req.method} ${req.path}`);
  next();
}, emergencyRoutes);

app.use('/api/scheduler', (req, res, next) => {
  console.log(`Scheduler route: ${req.method} ${req.path}`);
  next();
}, schedulerRoutes);

app.use('/api/stats', (req, res, next) => {
  console.log(`Stats route: ${req.method} ${req.path}`);
  next();
}, statsRoutes);

if (referralRoutes) {
  app.use('/api/referrals', (req, res, next) => {
    console.log(`Referral route: ${req.method} ${req.path}`);
    next();
  }, referralRoutes);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'One Hospital API is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join hospital-specific room for queue updates
  socket.on('join-hospital', (hospitalId) => {
    socket.join(`hospital-${hospitalId}`);
    console.log(`Client ${socket.id} joined hospital-${hospitalId}`);
  });

  // Join doctor-specific room for appointment updates
  socket.on('join-doctor', (doctorId) => {
    const roomName = `doctor-${doctorId}`;
    socket.join(roomName);
    console.log(`✅ Client ${socket.id} joined doctor room: ${roomName}`);
    console.log(`   Doctor ID received: ${doctorId}`);
    console.log(`   Rooms for this socket:`, socket.rooms);
  });

  // Join patient-specific room for emergency calls
  socket.on('join-patient', (patientId) => {
    socket.join(`patient-${patientId}`);
    console.log(`Client ${socket.id} joined patient-${patientId}`);
  });

  // Handle emergency call events
  socket.on('emergency-call-request', (data) => {
    socket.broadcast.emit('emergency-call-available', data);
  });

  socket.on('join-emergency-call', (callId) => {
    socket.join(`emergency-${callId}`);
    console.log(`Client ${socket.id} joined emergency call ${callId}`);
  });

  socket.on('leave-emergency-call', (callId) => {
    socket.leave(`emergency-${callId}`);
    console.log(`Client ${socket.id} left emergency call ${callId}`);
  });

  // WebRTC signaling for video calls
  socket.on('webrtc-offer', (data) => {
    console.log(`WebRTC offer for call ${data.callId}`);
    socket.to(`emergency-${data.callId}`).emit('webrtc-offer', data);
  });

  socket.on('webrtc-answer', (data) => {
    console.log(`WebRTC answer for call ${data.callId}`);
    socket.to(`emergency-${data.callId}`).emit('webrtc-answer', data);
  });

  socket.on('webrtc-ice-candidate', (data) => {
    console.log(`ICE candidate for call ${data.callId}`);
    socket.to(`emergency-${data.callId}`).emit('webrtc-ice-candidate', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404 routes with detailed info
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedRoute: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/hospitals',
      'GET /api/doctors/hospital/:hospitalId',
      'GET /api/appointments/patient',
      'GET /api/queue/doctor/:doctorId',
      'GET /api/ratings/hospital/:hospitalId',
      'GET /api/admin/hospitals/pending'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🏥 One Hospital Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for real-time updates`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  
  // Start appointment scheduler for automatic status updates
  startAppointmentScheduler();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { app, io };