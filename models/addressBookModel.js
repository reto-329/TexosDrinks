const db = require('../config/db');

// Get all addresses for a user
async function getUserAddresses(userId) {
  const { rows } = await db.query(
    'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC', 
    [userId]
  );
  return rows;
}

// Get a specific address by ID
async function getAddressById(addressId, userId = null) {
  if (userId) {
    const { rows } = await db.query(
      'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2', 
      [addressId, userId]
    );
    return rows[0];
  } else {
    const { rows } = await db.query(
      'SELECT * FROM user_addresses WHERE id = $1', 
      [addressId]
    );
    return rows[0];
  }
}

// Count addresses for a user
async function countUserAddresses(userId) {
  const { rows } = await db.query(
    'SELECT COUNT(*) FROM user_addresses WHERE user_id = $1', 
    [userId]
  );
  return parseInt(rows[0].count, 10);
}

// Create a new address
async function createAddress(userId, address) {
  try {
    const query = `
      INSERT INTO user_addresses
        (user_id, first_name, last_name, phone, additional_phone, street, 
         additional_info, city, state, country, zip, is_default)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      userId,
      address.first_name,
      address.last_name,
      address.phone,
      address.additional_phone || null,
      address.street,
      address.additional_info || null,
      address.city,
      address.state,
      address.country,
      address.zip,
      !!address.is_default
    ];
    return (await db.query(query, values)).rows[0];
  } catch (error) {
    console.error('Error creating address:', error);
    throw error;
  }
}

// Update an address
async function updateAddress(addressId, userId, address) {
  const query = `
    UPDATE user_addresses
    SET first_name = $3, last_name = $4, phone = $5, additional_phone = $6, 
        street = $7, additional_info = $8, city = $9, state = $10, 
        country = $11, zip = $12, is_default = $13
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  const values = [
    addressId,
    userId,
    address.first_name,
    address.last_name,
    address.phone,
    address.additional_phone || null,
    address.street,
    address.additional_info || null,
    address.city,
    address.state,
    address.country,
    address.zip,
    !!address.is_default
  ];
  return (await db.query(query, values)).rows[0];
}

// Delete an address
async function deleteAddress(addressId, userId) {
  const { rows } = await db.query(
    'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING *', 
    [addressId, userId]
  );
  return rows[0];
}

// Set an address as default
async function setDefaultAddress(addressId, userId) {
  // First unset all defaults
  await unsetDefaultAddress(userId);
  // Then set the new default
  const { rows } = await db.query(
    'UPDATE user_addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2 RETURNING *', 
    [addressId, userId]
  );
  return rows[0];
}

// Unset all default addresses for a user
async function unsetDefaultAddress(userId) {
  await db.query(
    'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', 
    [userId]
  );
}

module.exports = {
  getUserAddresses,
  getAddressById,
  countUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  unsetDefaultAddress
};