/**
 * Hospital Service
 * API calls for hospital-related operations
 */

import api from './api';

export const hospitalService = {
  // Get all hospitals with filters
  getHospitals: (params = {}) => {
    return api.get('/hospitals', { params });
  },

  // Get hospital by ID
  getHospitalById: (hospitalId) => {
    return api.get(`/hospitals/${hospitalId}`);
  },

  // Search hospitals
  searchHospitals: (params = {}) => {
    return api.get('/hospitals/search', { params });
  },

  // Register new hospital
  registerHospital: (hospitalData) => {
    return api.post('/hospitals', hospitalData);
  },

  // Update hospital
  updateHospital: (hospitalId, hospitalData) => {
    return api.put(`/hospitals/${hospitalId}`, hospitalData);
  },

  // Get hospital dashboard data
  getHospitalDashboard: (hospitalId) => {
    return api.get(`/hospitals/${hospitalId}/dashboard`);
  },

  // Get doctors by hospital
  getDoctorsByHospital: (hospitalId) => {
    return api.get(`/doctors/hospital/${hospitalId}`);
  },

  // Add new doctor
  addDoctor: (doctorData) => {
    return api.post('/doctors/add', doctorData);
  },

  // Update doctor
  updateDoctor: (doctorId, doctorData) => {
    return api.put(`/doctors/${doctorId}`, doctorData);
  },

  // Delete/Deactivate doctor
  deleteDoctor: (doctorId) => {
    return api.delete(`/doctors/${doctorId}`);
  },

  // Get doctor profile
  getDoctorProfile: (doctorId) => {
    return api.get(`/doctors/${doctorId}`);
  },

  // Update doctor availability
  updateDoctorAvailability: (availabilityData) => {
    return api.put('/doctors/availability', availabilityData);
  }
};