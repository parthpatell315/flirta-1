const express = require('express');
const router = express.Router();
const discoveryController = require('../controllers/discoveryController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, discoveryController.discoverProfiles);

module.exports = router;
