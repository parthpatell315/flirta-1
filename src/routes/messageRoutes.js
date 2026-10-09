const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');
const { actionLimiter } = require('../middleware/rateLimiter');

router.get('/conversations', requireAuth, messageController.getConversations);
router.get('/conversations/:id/messages', requireAuth, messageController.getMessages);
router.post('/conversations/:id/messages', requireAuth, actionLimiter, messageController.sendMessage);

module.exports = router;
