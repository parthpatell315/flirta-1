const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const { actionLimiter } = require('../middleware/rateLimiter');

router.get('/', requireAuth, profileController.getProfile);
router.put('/', requireAuth, actionLimiter, profileController.updateProfile);
router.post('/photos', requireAuth, actionLimiter, uploadAvatar.single('photo'), profileController.uploadPhoto);
router.delete('/photos/:id', requireAuth, profileController.deletePhoto);
router.patch('/photos/:id/primary', requireAuth, profileController.setPrimaryPhoto);
router.delete('/account', requireAuth, actionLimiter, profileController.deleteAccount);

module.exports = router;
