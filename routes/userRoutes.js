// Import Express framework
const express = require('express');
// Create a new router instance
const router = express.Router();
// Import user controller functions
const { register, login, getMe, requestOtp, verifyOtp, updateProfile, changePassword, forgotPassword, verifyResetOtp, resetPassword } = require('../controllers/userController');
// Import authentication middleware
const { protect } = require('../middlewares/auth');
// Import rate limiter middleware
const { loginLimiter } = require('../middlewares/rateLimiter');

// Register a new user
router.post('/register', register);
// Log in a user (with rate limiting)
router.post('/login', loginLimiter, login);
// Get the logged-in user's info
router.get('/me', protect, getMe);
// Update user profile
router.put('/profile', protect, updateProfile);
// Change password
router.post('/change-password', protect, changePassword);
// Request OTP for registration
router.post('/request-otp', requestOtp);
// Verify OTP for registration
router.post('/verify-otp', verifyOtp);
// Forgot password - request password reset
router.post('/forgot-password', forgotPassword);
// Verify reset OTP
router.post('/verify-reset-otp', verifyResetOtp);
// Reset password with token
router.post('/reset-password', resetPassword);
// Log out a user (clear token cookie)
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Export the router
module.exports = router;