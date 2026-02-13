# One Hospital - System Architecture

## Overview
One Hospital is a full-stack web application built using the MERN stack (MongoDB, Express.js, React.js, Node.js) with real-time capabilities using Socket.IO. The system follows a microservices-inspired architecture with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React.js Frontend (Port 3000)                                 │
│  ├── Components (UI Components)                                 │
│  ├── Pages (Route Components)                                   │
│  ├── Context (State Management)                                 │
│  ├── Services (API Calls)                                       │
│  └── Hooks (Custom React Hooks)                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/HTTPS + WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Node.js + Express.js Backend (Port 5000)                      │
│  ├── Routes (API Endpoints)                                     │
│  ├── Controllers (Business Logic)                               │
│  ├── Middleware (Auth, Validation, Error Handling)              │
│  ├── Models (Data Models)                                       │
│  └── Utils (Helper Functions)                                   │
│                                                                 │
│  Socket.IO Server (Real-time Communication)                     │
│  ├── Connection Management                                       │
│  ├── Room-based Broadcasting                                    │
│  └── Event Handling                                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ MongoDB Driver
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB Database (Port 27017)                                 │
│  ├── Users Collection                                           │
│  ├── Hospitals Collection                                       │
│  ├── Appointments Collection                                    │
│  └── Ratings Collection                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React.js 18**: UI library for building user interfaces
- **React Router DOM**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **React Hook Form**: Form handling and validation
- **React Query**: Server state management and caching
- **Socket.IO Client**: Real-time communication
- **React Hot Toast**: Toast notifications
- **Heroicons**: Icon library

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Socket.IO**: Real-time bidirectional communication
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **Express Validator**: Input validation middleware
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## System Components

### 1. Authentication System
- **JWT-based authentication** with role-based access control
- **Password hashing** using bcrypt
- **Token refresh mechanism** for session management
- **Role-based route protection** (Patient, Doctor, Hospital Admin, Super Admin)

### 2. User Management
- **Multi-role user system** with different user types
- **Profile management** with role-specific information
- **Account verification** and activation
- **Password reset functionality**

### 3. Hospital Management
- **Hospital registration** with admin approval workflow
- **Multi-tenant architecture** for hospital isolation
- **Department and facility management**
- **Operating hours and capacity management**

### 4. Appointment System
- **Online appointment booking** with slot validation
- **Token-based queue management** with auto-numbering
- **Real-time queue updates** using WebSocket
- **Appointment status tracking** (Confirmed, In-Progress, Completed, Cancelled)

### 5. Queue Management
- **Real-time queue monitoring** for patients and staff
- **Estimated waiting time calculation** based on queue position
- **Live updates** for appointment status changes
- **Doctor-wise queue segregation**

### 6. Rating & Review System
- **Multi-dimensional rating** (Hospital and Doctor)
- **Detailed feedback collection** with categorized ratings
- **Public review display** with moderation
- **Rating aggregation** for hospital/doctor rankings

### 7. Real-time Communication
- **WebSocket connections** for live updates
- **Room-based broadcasting** (Hospital rooms, Doctor rooms)
- **Event-driven notifications** for appointment changes
- **Connection management** with automatic reconnection

## Data Flow Architecture

### 1. Request Flow
```
Client Request → Middleware → Controller → Service → Model → Database
                    ↓
Response ← Middleware ← Controller ← Service ← Model ← Database
```

### 2. Authentication Flow
```
Login Request → Validate Credentials → Generate JWT → Store Token → Authenticated Requests
```

### 3. Real-time Update Flow
```
Database Change → Controller → Socket.IO → Broadcast to Rooms → Client Update
```

## Security Architecture

### 1. Authentication & Authorization
- **JWT tokens** with expiration and refresh mechanism
- **Role-based access control** (RBAC) for API endpoints
- **Route-level protection** with middleware
- **Hospital-specific data isolation**

### 2. Data Validation
- **Input validation** using Express Validator
- **Schema validation** at database level using Mongoose
- **XSS protection** through input sanitization
- **SQL injection prevention** (NoSQL injection for MongoDB)

### 3. API Security
- **CORS configuration** for cross-origin requests
- **Rate limiting** to prevent abuse
- **Request size limits** to prevent DoS attacks
- **Error handling** without sensitive information exposure

## Scalability Considerations

### 1. Database Design
- **Indexed collections** for fast queries
- **Compound indexes** for complex queries
- **Data aggregation** for analytics and reporting
- **Connection pooling** for database efficiency

### 2. Caching Strategy
- **Client-side caching** using React Query
- **API response caching** for static data
- **Session caching** for user authentication
- **Database query optimization**

### 3. Real-time Scalability
- **Room-based Socket.IO** for targeted updates
- **Connection management** with automatic cleanup
- **Event throttling** to prevent spam
- **Horizontal scaling** support for Socket.IO

## Deployment Architecture

### Development Environment
```
Frontend (localhost:3000) ← → Backend (localhost:5000) ← → MongoDB (localhost:27017)
```

### Production Environment
```
Load Balancer → Frontend (Static Files) → CDN
              ↓
              Backend Servers (Multiple Instances) → MongoDB Cluster
              ↓
              Socket.IO Server (Sticky Sessions)
```

## API Design Patterns

### 1. RESTful API Design
- **Resource-based URLs** (/api/hospitals, /api/appointments)
- **HTTP methods** for CRUD operations (GET, POST, PUT, DELETE)
- **Status codes** for response indication
- **Consistent response format** across all endpoints

### 2. Error Handling
- **Centralized error handling** middleware
- **Consistent error response format**
- **Logging and monitoring** for debugging
- **Graceful error recovery**

### 3. Validation Strategy
- **Input validation** at API level
- **Business logic validation** in controllers
- **Database constraints** for data integrity
- **Client-side validation** for user experience

## Performance Optimization

### 1. Frontend Optimization
- **Code splitting** for reduced bundle size
- **Lazy loading** for components and routes
- **Image optimization** and compression
- **Caching strategies** for API responses

### 2. Backend Optimization
- **Database indexing** for fast queries
- **Query optimization** and aggregation
- **Connection pooling** for database
- **Compression** for API responses

### 3. Real-time Optimization
- **Event throttling** to prevent spam
- **Room-based broadcasting** for targeted updates
- **Connection cleanup** for memory management
- **Efficient data serialization**

## Monitoring & Logging

### 1. Application Monitoring
- **Error tracking** and reporting
- **Performance monitoring** for API endpoints
- **User activity tracking**
- **System health checks**

### 2. Database Monitoring
- **Query performance** analysis
- **Connection pool** monitoring
- **Storage usage** tracking
- **Index effectiveness** monitoring

### 3. Real-time Monitoring
- **WebSocket connection** tracking
- **Event broadcasting** metrics
- **Room membership** monitoring
- **Message delivery** confirmation

## Future Enhancements

### 1. Microservices Migration
- **Service decomposition** by domain
- **API Gateway** for request routing
- **Service discovery** and registration
- **Inter-service communication**

### 2. Advanced Features
- **AI-based waiting time prediction**
- **Mobile application** development
- **Payment gateway** integration
- **Government system** integration

### 3. Scalability Improvements
- **Container orchestration** (Docker + Kubernetes)
- **Auto-scaling** based on load
- **Database sharding** for large datasets
- **CDN integration** for global reach