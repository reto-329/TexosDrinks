const rateLimit = require('express-rate-limit');

// Create a rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

// Create a rate limiter for admin login attempts (stricter)
const adminLoginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3, // 3 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 30 minutes'
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

module.exports = {
  loginLimiter,
  adminLoginLimiter
};