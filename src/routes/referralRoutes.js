const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { requireAuth } = require('../middleware/auth');

router.get('/me', requireAuth, referralController.getMine);

module.exports = router;
