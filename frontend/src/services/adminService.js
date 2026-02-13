/**
 * Admin Service
 * API calls for super admin operations
 */

import api from './api';

export const adminService = {
  // Get pending hospital approvals
  getPendingHospitals: async () => {
    try {
      const response = await api.get('/admin/hospitals/pending');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Approve or reject hospital
  updateHospitalApproval: async (hospitalId, status, rejectionReason = null) => {
    try {
      const payload = { status };
      if (status === 'rejected' && rejectionReason) {
        payload.rejectionReason = rejectionReason;
      }
      
      const response = await api.put(`/admin/hospitals/${hospitalId}/approval`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get platform statistics
  getPlatformStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all hospitals (including pending)
  getAllHospitals: async () => {
    try {
      const response = await api.get('/admin/hospitals');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default adminService;