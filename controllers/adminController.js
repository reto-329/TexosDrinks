// Import loginAdmin function from adminModel
const { loginAdmin } = require('../models/adminModel');
const { getAllCategories } = require('../models/categoryModel');
const { getAllProducts } = require('../models/productModel');
const { getOrderCount } = require('../models/orderModel');
const { getAllUsers } = require('../models/userModel');

// Controller for admin login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide username and password' 
      });
    }
    
    // Validate username format (no spaces, special characters)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username format'
      });
    }
    
    // Attempt to login
    const { admin, token } = await loginAdmin(username, password);
    
    // Set secure cookie with shorter duration for admin accounts
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours for admin accounts
    });
    
    // Return success response
    res.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    
    // The error message is already user-friendly from the model
    
    // Generic error message for other errors
    res.status(401).json({ 
      success: false,
      message: error.message || 'Authentication failed' 
    });
  }
};

// Controller for admin logout
const logout = (req, res) => {
  // Clear admin token cookie
  res.clearCookie('admin_token');
  res.json({ message: 'Logged out successfully' });
};

// Controller for admin dashboard
// dashboard function
const dashboard = async (req, res) => {
  try {
    // Get total product count
    const products = await getAllProducts();
    const productCount = Array.isArray(products) ? products.length : 0;
    
    // Get total category count
    const categories = await getAllCategories();
    const categoryCount = Array.isArray(categories) ? categories.length : 0;
    
    // Get total order count
    const orderCount = await getOrderCount();
    
    console.log('Dashboard counts:', { productCount, categoryCount, orderCount });
    
    res.render('admin/adminDashboard', {
      admin: req.admin || null,
      productCount,
      categoryCount,
      orderCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('admin/adminDashboard', {
      admin: req.admin || null,
      productCount: '--',
      categoryCount: '--',
      orderCount: '--',
      error: 'Server error'
    });
  }
};

// Controller for users management page
const users = async (req, res) => {
  try {
    res.render('admin/users', {
      admin: req.admin || null,
      page: 'users'
    });
  } catch (error) {
    console.error('Error rendering users page:', error);
    res.status(500).render('error', { message: 'Server error' });
  }
};

// API endpoint to get all users
const getUsersList = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Export login, logout, and dashboard controllers
module.exports = {
  login,
  logout,
  dashboard,
  users,
  getUsersList
};