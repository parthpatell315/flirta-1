const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const otpController = require('../controllers/otpController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { authLimiter, registerLimiter, otpLimiter } = require('../middleware/rateLimiter');

// Public client security configuration
router.get('/config', authController.getConfig);

// Authentication & Registration
router.post('/register', registerLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/otp/request', otpLimiter, otpController.requestOtp);
router.post('/otp/verify', otpLimiter, otpController.verifyOtp);

// Google Authentication & OAuth2
router.post('/google', authLimiter, authController.googleAuth);
router.get('/google', authController.googleOAuthUrl);
router.get('/google/callback', authController.googleOAuthCallback);

// Session & Account
router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, authController.logout);
router.delete('/account', requireAuth, authController.deleteAccount);

module.exports = router;
