/**
 * Statistics Service
 * API calls for platform statistics
 */

import api from './api';

export const statsService = {
  // Get platform statistics
  getPlatformStats: () => {
    return api.get('/stats/platform');
  }
};