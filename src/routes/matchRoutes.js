const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { requireAuth } = require('../middleware/auth');
const { actionLimiter } = require('../middleware/rateLimiter');

router.post('/like', requireAuth, actionLimiter, matchController.sendInteraction);
router.get('/', requireAuth, matchController.getMatches);
router.post('/:id/unmatch', requireAuth, matchController.unmatch);

module.exports = router;
