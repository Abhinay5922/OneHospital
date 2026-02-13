/**
 * Authentication Service
 * API calls for user authentication and profile management
 */

import api from './api';

export const authService = {
  // User registration
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  // User login
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Get user profile
  getProfile: () => {
    return api.get('/auth/profile');
  },

  // Update user profile
  updateProfile: (userData) => {
    return api.put('/auth/profile', userData);
  },

  // Change password
  changePassword: (passwordData) => {
    return api.put('/auth/change-password', passwordData);
  },

  // Logout
  logout: () => {
    return api.post('/auth/logout');
  }
};