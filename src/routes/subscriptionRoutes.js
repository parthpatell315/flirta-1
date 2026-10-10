const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { actionLimiter } = require('../middleware/rateLimiter');

// Public route to view plans
router.get('/plans', optionalAuth, subscriptionController.getPlans);

// Protected subscription routes
router.get('/me', requireAuth, subscriptionController.getMySubscription);
router.post('/create-order', requireAuth, actionLimiter, subscriptionController.createOrder);
router.post('/verify-payment', requireAuth, actionLimiter, subscriptionController.verifyPayment);
router.get('/likes-received', requireAuth, subscriptionController.getLikesReceived);
router.post('/boost', requireAuth, actionLimiter, subscriptionController.activateBoost);

// Webhook & PayU Gateway
router.post('/webhook', subscriptionController.handleWebhook);
router.post('/payu/initiate', requireAuth, actionLimiter, subscriptionController.initiatePayU);
router.post('/payu/callback', subscriptionController.handlePayUCallback);

module.exports = router;
