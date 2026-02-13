/**
 * Emergency Service
 * Handles emergency video call API requests
 */

import api from './api';

const emergencyService = {
  // Request emergency consultation
  requestEmergencyCall: async (data) => {
    try {
      const response = await api.post('/emergency/request', data);
      return response;
    } catch (error) {
      console.error('Request emergency call error:', error);
      throw error;
    }
  },

  // Accept emergency call (doctor)
  acceptEmergencyCall: async (callId) => {
    try {
      const response = await api.post(`/emergency/accept/${callId}`);
      return response;
    } catch (error) {
      console.error('Accept emergency call error:', error);
      throw error;
    }
  },

  // Start video call
  startVideoCall: async (callId) => {
    try {
      const response = await api.post(`/emergency/${callId}/start`);
      return response;
    } catch (error) {
      console.error('Start video call error:', error);
      throw error;
    }
  },

  // End emergency call
  endEmergencyCall: async (callId, data = {}) => {
    try {
      const response = await api.post(`/emergency/${callId}/end`, data);
      return response;
    } catch (error) {
      console.error('End emergency call error:', error);
      throw error;
    }
  },

  // Get emergency call details
  getEmergencyCall: async (callId) => {
    try {
      const response = await api.get(`/emergency/${callId}`);
      return response;
    } catch (error) {
      console.error('Get emergency call error:', error);
      throw error;
    }
  },

  // Get patient emergency call history
  getPatientEmergencyCalls: async (params = {}) => {
    try {
      const response = await api.get('/emergency/patient/history', { params });
      return response;
    } catch (error) {
      console.error('Get patient emergency calls error:', error);
      throw error;
    }
  },

  // Get doctor emergency call history
  getDoctorEmergencyCalls: async (params = {}) => {
    try {
      const response = await api.get('/emergency/doctor/history', { params });
      return response;
    } catch (error) {
      console.error('Get doctor emergency calls error:', error);
      throw error;
    }
  },

  // Send chat message
  sendChatMessage: async (callId, message) => {
    try {
      const response = await api.post(`/emergency/${callId}/chat`, { message });
      return response;
    } catch (error) {
      console.error('Send chat message error:', error);
      throw error;
    }
  },

  // Toggle doctor emergency availability
  toggleEmergencyAvailability: async (available) => {
    try {
      const response = await api.post('/emergency/doctor/availability', { available });
      return response;
    } catch (error) {
      console.error('Toggle emergency availability error:', error);
      throw error;
    }
  }
};

export default emergencyService;