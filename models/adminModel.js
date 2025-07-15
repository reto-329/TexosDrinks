const { query } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Function to log in an admin
const loginAdmin = async (username, password) => {
  // Add delay to mitigate timing attacks
  await new Promise(resolve => setTimeout(resolve, 100));

  // Query admin by username
  const result = await query('SELECT * FROM admins WHERE username = $1', [username]);

  if (result.rows.length === 0) {
    // If no admin found, throw generic error
    throw new Error('Invalid username or password');
  }

  const admin = result.rows[0];
  // Compare provided password with stored hash
  const isMatch = await bcrypt.compare(password, admin.password_hash);

  if (!isMatch) {
    // If password doesn't match, throw error
    throw new Error('Invalid username or password');
  }

  // Create JWT token for admin
  const token = jwt.sign({ id: admin.id, role: 'admin' }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: '30d',
  });

  // Return admin info and token
  return { admin, token };
};

// Export loginAdmin function
module.exports = {
  loginAdmin,
};