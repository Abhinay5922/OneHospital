/**
 * Main App Component
 * Root component with routing and global providers
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import HospitalSearch from './pages/hospitals/HospitalSearch';
import HospitalDetails from './pages/hospitals/HospitalDetails';
import BookAppointment from './pages/appointments/BookAppointment';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import HospitalDashboard from './pages/dashboard/HospitalDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Profile from './pages/Profile';
import EmergencyConsultation from './pages/emergency/EmergencyConsultation';
import RateAppointment from './pages/rating/RateAppointment';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
              <Navbar />
              
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/hospitals" element={<HospitalSearch />} />
                  <Route path="/hospitals/:hospitalId" element={<HospitalDetails />} />
                  
                  {/* Protected Routes */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  
                  {/* Patient Routes */}
                  <Route path="/dashboard/patient" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/book-appointment/:hospitalId/:doctorId" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                      <BookAppointment />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/rate-appointment/:appointmentId" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                      <RateAppointment />
                    </ProtectedRoute>
                  } />
                  
                  {/* Emergency Routes */}
                  <Route path="/emergency/:callId" element={
                    <ProtectedRoute allowedRoles={['patient', 'doctor']}>
                      <EmergencyConsultation />
                    </ProtectedRoute>
                  } />
                  
                  {/* Doctor Routes */}
                  <Route path="/dashboard/doctor" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Hospital Admin Routes */}
                  <Route path="/dashboard/hospital" element={
                    <ProtectedRoute allowedRoles={['hospital_admin']}>
                      <HospitalDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Super Admin Routes */}
                  <Route path="/dashboard/admin" element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;