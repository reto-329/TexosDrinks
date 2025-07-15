const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/adminSettingsController');
const { protect, adminProtect } = require('../middlewares/auth');

// Admin settings routes
router.get('/settings', adminProtect, getSettings);
router.post('/settings', adminProtect, updateSettings);

module.exports = router;