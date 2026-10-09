const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { actionLimiter } = require('../middleware/rateLimiter');

router.get('/', optionalAuth, eventController.listEvents);
router.get('/:id', optionalAuth, eventController.getEventDetails);
router.post('/:id/attend', requireAuth, actionLimiter, eventController.setAttendance);
router.delete('/:id/attend', requireAuth, eventController.removeAttendance);

module.exports = router;
