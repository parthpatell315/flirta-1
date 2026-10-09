const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

router.get('/events', adminController.getAllEvents);
router.post('/events', adminController.createEvent);
router.put('/events/:id', adminController.updateEvent);

router.get('/reports', adminController.getReports);
router.patch('/reports/:id', adminController.resolveReport);

router.patch('/users/:id/suspend', adminController.setUserSuspension);
router.get('/metrics', adminController.getMetrics);

module.exports = router;
