/**
 * Statistics Routes
 * Routes for platform statistics
 */

const express = require('express');
const router = express.Router();

const { getPlatformStats } = require('../controllers/statsController');

// Public route - no authentication required
router.get('/platform', getPlatformStats);

module.exports = router;