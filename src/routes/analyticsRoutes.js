const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { optionalAuth } = require('../middleware/auth');

router.post('/track', optionalAuth, analyticsController.trackEvent);

module.exports = router;
