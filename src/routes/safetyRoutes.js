const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safetyController');
const { requireAuth } = require('../middleware/auth');
const { actionLimiter } = require('../middleware/rateLimiter');

router.post('/block', requireAuth, safetyController.blockUser);
router.delete('/block/:userId', requireAuth, safetyController.unblockUser);
router.get('/blocked', requireAuth, safetyController.getBlockedUsers);
router.post('/report', requireAuth, actionLimiter, safetyController.submitReport);
router.post('/grievance', actionLimiter, safetyController.submitGrievance);

module.exports = router;
