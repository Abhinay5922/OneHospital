/**
 * Appointment Service
 * API calls for appointment management
 */

import api from './api';

export const appointmentService = {
  // Book new appointment
  bookAppointment: (appointmentData) => {
    return api.post('/appointments', appointmentData);
  },

  // Get patient appointments
  getPatientAppointments: (params = {}) => {
    return api.get('/appointments/patient', { params });
  },

  // Get doctor appointments
  getDoctorAppointments: (params = {}) => {
    return api.get('/appointments/doctor', { params });
  },

  // Get appointment by ID
  getAppointmentById: (appointmentId) => {
    return api.get(`/appointments/${appointmentId}`);
  },

  // Update appointment status
  updateAppointmentStatus: (appointmentId, statusData) => {
    return api.put(`/appointments/${appointmentId}/status`, statusData);
  },

  // Cancel appointment
  cancelAppointment: (appointmentId, reason) => {
    return api.put(`/appointments/${appointmentId}/cancel`, { reason });
  },

  // Get queue status
  getQueueStatus: (doctorId, date) => {
    return api.get(`/queue/doctor/${doctorId}`, { params: { date } });
  },

  // Get hospital queue summary
  getHospitalQueueSummary: (hospitalId, date) => {
    return api.get(`/queue/hospital/${hospitalId}`, { params: { date } });
  }
};