// Import database query helper
const { query } = require('../config/db');
// Import bcrypt for password hashing
const bcrypt = require('bcrypt');
// Import JWT for token creation
const jwt = require('jsonwebtoken');

// Register a new user
const registerUser = async (username, email, phonenumber, password) => {
  // Hash the user's password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Insert new user into database
  const result = await query(
    'INSERT INTO users (username, email, phonenumber, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
    [username, email, phonenumber, hashedPassword]
  );
  
  // Return the new user
  return result.rows[0];
};

// Log in a user
const loginUser = async (email, password) => {
  // Add a small delay to prevent timing attacks
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Find user by email
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }
  
  const user = result.rows[0];
  // Compare provided password with stored hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }
  
  // Create JWT token for user
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
  
  // Return user info and token
  return { user, token };
};

// Get a user by their ID
const getUserById = async (id) => {
  try {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userResult.rows[0]) return null;
    
    const user = userResult.rows[0];
    
    try {
      // Get user addresses
      const addressResult = await query('SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC', [id]);
      user.addresses = addressResult.rows || [];
    } catch (error) {
      // If there's an error fetching addresses, just set to an empty array
      console.error('Error fetching addresses:', error.message);
      user.addresses = [];
    }
    
    return user;
  } catch (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }
};

// Get a user by their email
const getUserByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

// Get a user by their phone number
const getUserByPhone = async (phonenumber) => {
  const result = await query('SELECT * FROM users WHERE phonenumber = $1', [phonenumber]);
  return result.rows[0];
};

// Get all users
const getAllUsers = async () => {
  try {
    const result = await query('SELECT id, username, email, phonenumber, created_at FROM users ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error fetching all users:', error.message);
    throw error;
  }
};

// Delete a user by ID
const deleteUser = async (userId) => {
  try {
    // Delete user's data from related tables first
    await query('DELETE FROM user_addresses WHERE user_id = $1', [userId]);
    await query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)', [userId]);
    await query('DELETE FROM carts WHERE user_id = $1', [userId]);
    
    // Finally delete the user
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting user:', error.message);
    throw error;
  }
};

// Update user profile
const updateUserProfile = async (userId, userData) => {
  try {
    // Check if email already exists for another user
    if (userData.email) {
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [userData.email, userId]);
      if (emailCheck.rows.length > 0) {
        throw new Error('Email already in use by another account');
      }
    }
    
    // Check if phone already exists for another user
    if (userData.phonenumber) {
      const phoneCheck = await query('SELECT id FROM users WHERE phonenumber = $1 AND id != $2', [userData.phonenumber, userId]);
      if (phoneCheck.rows.length > 0) {
        throw new Error('Phone number already in use by another account');
      }
    }
    
    // Build the update query dynamically based on provided fields
    const updateFields = [];
    const queryParams = [];
    let paramCounter = 1;
    
    // Add each field that needs to be updated
    if (userData.username) {
      updateFields.push(`username = $${paramCounter}`);
      queryParams.push(userData.username);
      paramCounter++;
    }
    
    if (userData.email) {
      updateFields.push(`email = $${paramCounter}`);
      queryParams.push(userData.email);
      paramCounter++;
    }
    
    if (userData.phonenumber) {
      updateFields.push(`phonenumber = $${paramCounter}`);
      queryParams.push(userData.phonenumber);
      paramCounter++;
    }
    
    // If no fields to update, return early
    if (updateFields.length === 0) {
      throw new Error('No fields provided for update');
    }
    
    // Add the user ID as the last parameter
    queryParams.push(userId);
    
    // Execute the update query
    const result = await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCounter} RETURNING id, username, email, phonenumber`,
      queryParams
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    throw error;
  }
};

// Change user password
const changeUserPassword = async (userId, currentPassword, newPassword) => {
  try {
    // Get the user's current password hash
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (!userResult.rows[0]) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    
    // Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password in the database
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);
    
    return true;
  } catch (error) {
    console.error('Error changing password:', error.message);
    throw error;
  }
};

// Export all user functions
module.exports = {
  registerUser,
  loginUser,
  getUserById,
  getUserByEmail,
  getUserByPhone,
  getAllUsers,
  deleteUser,
  updateUserProfile,
  changeUserPassword,
};