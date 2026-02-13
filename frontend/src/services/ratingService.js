/**
 * Rating Service
 * API calls for rating and feedback management
 */

import api from './api';

export const ratingService = {
  // Submit rating for completed appointment
  submitRating: (ratingData) => {
    return api.post('/ratings', ratingData);
  },

  // Get hospital ratings and reviews
  getHospitalRatings: (hospitalId, params = {}) => {
    return api.get(`/ratings/hospital/${hospitalId}`, { params });
  },

  // Get doctor ratings and reviews
  getDoctorRatings: (doctorId, params = {}) => {
    return api.get(`/ratings/doctor/${doctorId}`, { params });
  },

  // Get patient's submitted ratings
  getPatientRatings: (params = {}) => {
    return api.get('/ratings/patient/my-ratings', { params });
  },

  // Get appointments eligible for rating
  getEligibleAppointments: () => {
    return api.get('/ratings/patient/eligible-appointments');
  },

  // Update rating (within 7 days)
  updateRating: (ratingId, updateData) => {
    return api.put(`/ratings/${ratingId}`, updateData);
  }
};