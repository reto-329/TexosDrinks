// Import Express framework
const express = require('express');
// Create a new router instance
const router = express.Router();
// Import order controller functions
const { checkout, getOrder, getMyOrders, verifyPayment } = require('../controllers/orderController');
// Import authentication middleware
const { protect } = require('../middlewares/auth');

// Checkout route (create order from cart)
router.post('/checkout', protect, checkout);
// Get a single order by ID
router.get('/:id', protect, getOrder);
// Get all orders for the logged-in user
router.get('/', protect, getMyOrders);

// Export the router
module.exports = router;