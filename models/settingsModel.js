const { query } = require('../config/db');

// Get a setting by key
const getSetting = async (key) => {
  const result = await query('SELECT * FROM settings WHERE key = $1', [key]);
  return result.rows[0];
};

// Get all settings
const getAllSettings = async () => {
  const result = await query('SELECT * FROM settings ORDER BY key');
  return result.rows;
};

// Update a setting
const updateSetting = async (key, value) => {
  const result = await query(
    'UPDATE settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *',
    [value, key]
  );
  return result.rows[0];
};

module.exports = {
  getSetting,
  getAllSettings,
  updateSetting
};