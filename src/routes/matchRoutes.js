const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { requireAuth } = require('../middleware/auth');
const { likeLimiter } = require('../middleware/rateLimiter');

router.post('/like', requireAuth, likeLimiter, matchController.sendInteraction);
router.post('/super-like', requireAuth, likeLimiter, matchController.sendSuperLike);
router.get('/', requireAuth, matchController.getMatches);
router.post('/:id/unmatch', requireAuth, matchController.unmatch);

module.exports = router;
