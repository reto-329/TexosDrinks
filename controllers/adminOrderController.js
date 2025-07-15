// Import order model functions
const {
  getOrderById,
  updateOrderStatus,
  getAllOrderStatuses,
  getUserOrders
} = require('../models/orderModel');

// Get all orders (admin) with pagination
const getAllOrders = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get all users' orders with pagination
    const { query } = require('../config/db');
    
    // Get total count of orders
    const countResult = await query('SELECT COUNT(*) as total FROM orders');
    const total = parseInt(countResult.rows[0].total, 10);
    
    // Get paginated orders
    const ordersResult = await query(`
      SELECT o.*, os.name as status_name, u.username, u.email
      FROM orders o
      LEFT JOIN order_status os ON o.status_id = os.id
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      orders: ordersResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get order details (admin)
const getOrderDetails = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    
    // Get user details
    const { query } = require('../config/db');
    const userResult = await query('SELECT id, username, email FROM users WHERE id = $1', [order.order.user_id]);
    
    // Get address details if exists
    let address = null;
    if (order.order.address_id) {
      const addressResult = await query('SELECT * FROM user_addresses WHERE id = $1', [order.order.address_id]);
      if (addressResult.rows.length > 0) {
        address = addressResult.rows[0];
      }
    }
    
    res.json({
      ...order,
      user: userResult.rows[0],
      address
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update order status (admin)
const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Update order status
    const updatedOrder = await updateOrderStatus(id, status);
    
    res.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all order statuses
const getOrderStatuses = async (req, res) => {
  try {
    const statuses = await getAllOrderStatuses();
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching order statuses:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderDetails,
  updateOrderStatusAdmin,
  getOrderStatuses
};