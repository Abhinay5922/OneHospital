/**
 * Referral Service
 * API calls for doctor referral operations
 */

import api from './api';

export const referralService = {
  // Create new referral
  createReferral: (referralData) => {
    return api.post('/referrals', referralData);
  },

  // Get sent referrals
  getSentReferrals: (params = {}) => {
    return api.get('/referrals/sent', { params });
  },

  // Get received referrals
  getReceivedReferrals: (params = {}) => {
    return api.get('/referrals/received', { params });
  },

  // Get referral by ID
  getReferralById: (referralId) => {
    return api.get(`/referrals/${referralId}`);
  },

  // Respond to referral
  respondToReferral: (referralId, responseData) => {
    return api.put(`/referrals/${referralId}/respond`, responseData);
  },

  // Get available doctors for referral
  getAvailableDoctors: (params = {}) => {
    return api.get('/referrals/doctors', { params });
  },

  // Get referral statistics
  getReferralStats: () => {
    return api.get('/referrals/stats');
  }
};