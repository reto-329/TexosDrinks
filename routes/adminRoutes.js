const express = require('express');
const router = express.Router();
const { login, logout, dashboard, users, getUsersList } = require('../controllers/adminController');
const { adminAuth, adminProtect } = require('../middlewares/auth');
const { getAllProducts } = require('../models/productModel');
const { getAllCategories } = require('../models/categoryModel');
const { getOrderCount } = require('../models/orderModel');
const { adminLoginLimiter } = require('../middlewares/rateLimiter');

// Admin login route (with rate limiting)
router.post('/login', adminLoginLimiter, login);

// Admin logout route
router.post('/logout', logout);

// Admin dashboard route
router.get('/dashboard', adminProtect, dashboard);

// Admin users management route
router.get('/users', adminProtect, users);

// API endpoint for users list
router.get('/api/users', adminProtect, getUsersList);

// API endpoint for dashboard counts
router.get('/dashboard-counts', adminProtect, async (req, res) => {
  try {
    // Get total product count
    const products = await getAllProducts();
    const productCount = Array.isArray(products) ? products.length : 0;
    
    // Get total category count
    const categories = await getAllCategories();
    const categoryCount = Array.isArray(categories) ? categories.length : 0;
    
    // Get total order count
    const orderCount = await getOrderCount();
    
    res.json({
      productCount,
      categoryCount,
      orderCount
    });
  } catch (error) {
    console.error('Error getting dashboard counts:', error);
    res.status(500).json({ error: 'Failed to get dashboard counts' });
  }
});

module.exports = router;