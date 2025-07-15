const { getAllSettings, updateSetting } = require('../models/settingsModel');

// Get all settings
const getSettings = async (req, res) => {
  try {
    const settings = await getAllSettings();
    res.render('admin/settings', {
      user: req.admin,
      settings,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.redirect('/admin/dashboard?error=Failed to load settings');
  }
};

// Update settings
const updateSettings = async (req, res) => {
  try {
    const { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } = req.body;
    
    // Validate inputs
    if (FREE_DELIVERY_THRESHOLD === undefined || DELIVERY_FEE === undefined) {
      return res.redirect('/admin/settings?error=Missing required settings');
    }
    
    // Update settings
    await updateSetting('FREE_DELIVERY_THRESHOLD', FREE_DELIVERY_THRESHOLD);
    await updateSetting('DELIVERY_FEE', DELIVERY_FEE);
    
    res.redirect('/admin/settings?success=Settings updated successfully');
  } catch (error) {
    console.error('Error updating settings:', error);
    res.redirect('/admin/settings?error=Failed to update settings');
  }
};

module.exports = {
  getSettings,
  updateSettings
};