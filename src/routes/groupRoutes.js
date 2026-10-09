const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { actionLimiter } = require('../middleware/rateLimiter');

router.get('/', optionalAuth, groupController.listGroups);
router.get('/:id', optionalAuth, groupController.getGroupDetails);
router.post('/', requireAuth, actionLimiter, groupController.createGroup);
router.post('/:id/join', requireAuth, actionLimiter, groupController.joinGroup);
router.post('/:id/leave', requireAuth, groupController.leaveGroup);
router.patch('/:id/requests/:membershipId', requireAuth, groupController.manageRequest);
router.delete('/:id/members/:userId', requireAuth, groupController.removeMember);

module.exports = router;
