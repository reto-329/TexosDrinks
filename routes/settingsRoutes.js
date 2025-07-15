const express = require('express');
const router = express.Router();
const { getAllSettings } = require('../models/settingsModel');

// Get delivery settings
router.get('/delivery', async (req, res) => {
  try {
    const settings = await getAllSettings();
    const deliverySettings = {};
    
    // Convert settings array to object and ensure numeric values are parsed
    settings.forEach(setting => {
      // Parse numeric values
      if (setting.key === 'FREE_DELIVERY_THRESHOLD' || setting.key === 'DELIVERY_FEE') {
        deliverySettings[setting.key] = parseFloat(setting.value);
      } else {
        deliverySettings[setting.key] = setting.value;
      }
    });
    
    console.log('Delivery settings from database:', deliverySettings);
    
    res.json(deliverySettings);
  } catch (error) {
    console.error('Error fetching delivery settings:', error);
    res.status(500).json({ error: 'Failed to load delivery settings' });
  }
});

module.exports = router;