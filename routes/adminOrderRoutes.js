const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middlewares/auth');
const {
  getAllOrders,
  getOrderDetails,
  updateOrderStatusAdmin,
  getOrderStatuses
} = require('../controllers/adminOrderController');

// Get all orders
router.get('/', adminProtect, getAllOrders);

// Get order statuses
router.get('/statuses', adminProtect, getOrderStatuses);

// Get order details
router.get('/:id', adminProtect, getOrderDetails);

// Update order status
router.put('/:id/status', adminProtect, updateOrderStatusAdmin);

module.exports = router;