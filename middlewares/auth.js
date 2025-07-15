const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const userAuth = async (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query('SELECT id, username, email FROM users WHERE id = $1', [decoded.id]);
      
      if (result.rows.length > 0) {
        req.user = result.rows[0];
        res.locals.user = result.rows[0];
      }
    } catch (err) {
      console.error('Optional auth error:', err.message);
    }
  }
  
  next();
};

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Fallback: check for token in cookies (for httpOnly cookie auth)
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    req.user = user.rows[0];
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminProtect = async (req, res, next) => {
  let token;

  // Check cookies first (for HTTP-only cookie)
  if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    const admin = await query('SELECT * FROM admins WHERE id = $1', [decoded.id]);
    if (admin.rows.length === 0) {
      return res.status(401).json({ message: 'Not authorized, admin not found' });
    }
    req.admin = admin.rows[0];
    next();
  } catch (error) {
    console.error(error);
    let message = 'Not authorized, token failed';
    if (error.name === 'TokenExpiredError') {
      message = 'Session expired, please login again';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }
    res.status(401).json({ message });
  }
};

module.exports = { protect, adminProtect, userAuth };