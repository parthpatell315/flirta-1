const express = require('express');
const router = express.Router();
const hostController = require('../controllers/hostController');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { actionLimiter } = require('../middleware/rateLimiter');

router.post('/apply', requireAuth, actionLimiter, hostController.apply);
router.get('/me/earnings', requireAuth, hostController.earnings);
router.post('/payouts', requireAuth, actionLimiter, hostController.requestPayout);
router.post('/:hostUserId/gifts/order', requireAuth, actionLimiter, (req, res) => {
  req.params.kind = 'gifts';
  return hostController.createOrder(req, res);
});
router.post('/:hostUserId/sessions/order', requireAuth, actionLimiter, (req, res) => {
  req.params.kind = 'sessions';
  return hostController.createOrder(req, res);
});
router.post('/orders/verify', requireAuth, actionLimiter, hostController.verifyOrder);

router.get('/admin', requireAuth, requireAdmin, hostController.adminList);
router.patch('/admin/:userId', requireAuth, requireAdmin, hostController.adminReview);

module.exports = router;
