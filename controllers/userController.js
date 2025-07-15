// Import user model functions
const {
  registerUser,
  loginUser,
  getUserById,
  getUserByEmail,
  getUserByPhone,
  updateUserProfile,
  changeUserPassword,
} = require('../models/userModel');
// Import database query helper
const { query } = require('../config/db');
// Import bcrypt for password hashing
const bcrypt = require('bcrypt');
// Import protect middleware for authentication
const { protect } = require('../middlewares/auth');
// Import OTP utilities
const { pendingRegistrations, generateOTP, sendOTPEmail } = require('../utils/otp');
// Import JWT for token creation
const jwt = require('jsonwebtoken');

// Controller to register a new user
const register = async (req, res) => {
  try {
    // Get user details from request body
    const { username, email, phonenumber, password } = req.body;
    
    if (!username || !email || !phonenumber || !password) {
      // If missing fields, return error
      return res.status(400).json({ message: 'Please provide all fields' });
    }
    
    // Register new user
    const user = await registerUser(username, email, phonenumber, password);
    
    // Respond with new user info
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      phonenumber: user.phonenumber,
    });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Controller to log in a user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      // If missing fields, return error
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    
    // Attempt to log in user
    const { user, token } = await loginUser(email, password);

    // Set token as HTTP-only cookie with moderate duration
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days for regular users
    });

    // Respond with user info
    res.json({
      id: user.id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    // Handle errors
    console.error('Login error:', error);
    
    // The error message is already user-friendly from the model
    
    res.status(401).json({ message: error.message || 'Authentication failed' });
  }
};

// Controller to get the logged-in user's info
const getMe = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller to request OTP for registration
const requestOtp = async (req, res) => {
  try {
    const { username, email, phonenumber, password } = req.body;
    if (!username || !email || !phonenumber || !password) {
      // If missing fields, return error
      return res.status(400).json({ message: 'Please provide all fields' });
    }
    // Check for existing email or phone
    if (await getUserByEmail(email)) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    if (await getUserByPhone(phonenumber)) {
      return res.status(400).json({ message: 'Phone number already registered.' });
    }
    // Check if OTP already sent
    if (pendingRegistrations[email]) {
      return res.status(400).json({ message: 'OTP already sent. Please check your email.' });
    }
    // Generate OTP and store pending registration
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    pendingRegistrations[email] = { otp, data: { username, email, phonenumber, password }, expiresAt };
    await sendOTPEmail(email, otp);
    res.json({ message: 'OTP sent to your email.' });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP route
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const pending = pendingRegistrations[email];
    if (!pending) return res.status(400).json({ message: 'No OTP request found.' });
    if (pending.expiresAt < Date.now()) {
      delete pendingRegistrations[email];
      return res.status(400).json({ message: 'OTP expired.' });
    }
    if (pending.otp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });
    // Register user
    const { username, phonenumber, password } = pending.data;
    const user = await registerUser(username, email, phonenumber, password);
    delete pendingRegistrations[email];
    res.status(201).json({ message: 'Registration successful!', user: { id: user.id, username: user.username, email: user.email, phonenumber: user.phonenumber } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'OTP verification failed.' });
  }
};

// Controller to update user profile
const updateProfile = async (req, res) => {
  try {
    const { username, email, phonenumber } = req.body;
    
    // Validate input
    if (!username && !email && !phonenumber) {
      return res.status(400).json({ message: 'Please provide at least one field to update' });
    }
    
    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
    }
    
    // Validate phone format if provided
    if (phonenumber) {
      // Simple validation for phone number (adjust as needed)
      if (!/^[0-9]{10,15}$/.test(phonenumber)) {
        return res.status(400).json({ message: 'Please enter a valid phone number' });
      }
    }
    
    // Update user profile
    const updatedUser = await updateUserProfile(req.user.id, { username, email, phonenumber });
    
    // Return updated user info
    res.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to update profile' 
    });
  }
};

// Controller to change user password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    
    // Validate input
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if new password and confirm password match
    if (new_password !== confirm_password) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    
    // Validate password strength - simple minimum length check
    if (new_password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Change the password
    await changeUserPassword(req.user.id, current_password, new_password);
    
    // Return success message
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to change password' 
    });
  }
};

// Store password reset OTPs
const passwordResetOtps = {};

// Controller for forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }
    
    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return res.json({ message: 'If your email is registered, you will receive a reset code shortly' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // Store OTP
    passwordResetOtps[email] = { otp, expiresAt };
    
    // Send OTP email
    await sendOTPEmail(email, otp, 'Password Reset');
    
    res.json({ message: 'Reset code sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller to verify reset OTP
const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and verification code' });
    }
    
    // Check if OTP exists and is valid
    const resetData = passwordResetOtps[email];
    if (!resetData) {
      return res.status(400).json({ message: 'No reset request found' });
    }
    
    if (resetData.expiresAt < Date.now()) {
      delete passwordResetOtps[email];
      return res.status(400).json({ message: 'Verification code expired' });
    }
    
    if (resetData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Generate a token for password reset
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    // Store the token in the reset data
    resetData.token = resetToken;
    
    res.json({ message: 'Verification successful', token: resetToken });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller to reset password
const resetPassword = async (req, res) => {
  try {
    const { email, token, new_password, confirm_password } = req.body;
    
    if (!email || !token || !new_password || !confirm_password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if passwords match
    if (new_password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    // Validate password length
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.email !== email) {
        return res.status(400).json({ message: 'Invalid reset token' });
      }
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Check if reset data exists
    const resetData = passwordResetOtps[email];
    if (!resetData || resetData.token !== token) {
      return res.status(400).json({ message: 'Invalid reset request' });
    }
    
    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update user's password in the database
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, user.id]);
    
    // Clean up reset data
    delete passwordResetOtps[email];
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export all user controllers
module.exports = {
  register,
  login,
  getMe,
  requestOtp,
  verifyOtp,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};