// Import order model functions
const {
  createOrder,
  addOrderItems,
  getOrderById,
  getUserOrders,
  updateOrderStatus
} = require('../models/orderModel');
// Import cart model functions
const { getCartItems, clearCart, calculateCartTotals } = require('../models/cartModel');
const { getOrCreateCart } = require('../models/cartModel');
// Import address book model
const { getUserAddresses } = require('../models/addressBookModel');
// Import protect middleware for authentication
const { protect } = require('../middlewares/auth');
// Import transaction service
const { getTransactionByReference, saveTransaction, updateTransactionStatus } = require('../services/paystackService');

// Controller to handle checkout (create order from cart)
const checkout = async (req, res) => {
  try {
    // Get or create cart for user
    const cart = await getOrCreateCart(req.user.id);
    // Get all items in the cart
    const items = await getCartItems(cart.id);
    
    if (items.length === 0) {
      // If cart is empty, return error
      return res.status(400).json({ message: 'Cart is empty' });
    }
    
    // Get address ID from request (optional)
    const { addressId } = req.body;
    
    // Calculate total amount for the order
    const cartTotals = await calculateCartTotals(items);
    const total_amount = cartTotals.total;
    
    // Create new order (addressId is now optional)
    const order = await createOrder(req.user.id, total_amount, addressId || null);
    
    // Add each item in the cart to the order
    await Promise.all(
      items.map((item) =>
        addOrderItems(order.id, item.product_id, item.quantity, item.price)
      )
    );
    
    // Respond with order details
    res.status(201).json(order);
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Controller to render checkout page
const getCheckoutPage = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect('/login?message=Please log in to checkout');
    }
    
    // Get user's cart
    const cart = await getOrCreateCart(req.user.id);
    const items = await getCartItems(cart.id);
    
    if (items.length === 0) {
      return res.redirect('/cart');
    }
    
    // Calculate cart totals
    const totals = await calculateCartTotals(items);
    
    // Get user's addresses
    const addresses = await getUserAddresses(req.user.id);
    
    res.render('checkout', {
      user: req.user,
      cart: {
        cartId: cart.id,
        items,
        ...totals
      },
      addresses
    });
  } catch (error) {
    console.error('Error rendering checkout page:', error);
    res.status(500).render('error', { 
      message: 'Failed to load checkout page',
      error: { status: 500 },
      user: req.user
    });
  }
};

// Controller to handle payment verification
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const { order_id } = req.query;
    
    if (!reference || !order_id) {
      return res.status(400).render('payment-verification', {
        user: req.user,
        status: 'failed',
        message: 'Missing reference or order ID',
        transaction: null,
        order: null
      });
    }
    
    // Get order details
    const orderDetails = await getOrderById(order_id);
    if (!orderDetails) {
      return res.status(404).render('payment-verification', {
        user: req.user,
        status: 'failed',
        message: 'Order not found',
        transaction: null,
        order: null
      });
    }
    
    // Verify payment directly with Paystack API
    try {
      const { verifyTransaction } = require('../services/paystackService');
      const paystackResponse = await verifyTransaction(reference);
      
      // Log verification response for monitoring
      console.log('Paystack verification response for order #' + order_id + ':', 
                  paystackResponse.data.status);
      
      // Get or create transaction record
      let transaction = await getTransactionByReference(reference);
      
      if (!transaction) {
        // Create transaction if it doesn't exist
        transaction = await saveTransaction({
          order_id: order_id,
          reference: reference,
          amount: orderDetails.order.total_amount,
          status: paystackResponse.data.status,
          customer_email: req.user.email,
          metadata: {
            order_id: order_id,
            user_id: req.user.id
          }
        });
      } else {
        // Update transaction status
        transaction = await updateTransactionStatus(reference, paystackResponse.data.status);
      }
      
      // Check if transaction was successful
      if (paystackResponse.data.status === 'success') {
        // Update order status to paid
        await updateOrderStatus(order_id, 'paid');
        
        // Clear the cart after successful payment
        const cart = await getOrCreateCart(req.user.id);
        await clearCart(cart.id);
        
        return res.render('payment-verification', {
          user: req.user,
          status: 'success',
          transaction,
          order: orderDetails.order
        });
      } else {
        // Payment failed
        return res.render('payment-verification', {
          user: req.user,
          status: 'failed',
          message: 'Payment was not successful: ' + paystackResponse.data.gateway_response,
          transaction,
          order: orderDetails.order
        });
      }
    } catch (verifyError) {
      console.error('Paystack verification error:', verifyError);
      
      // Get transaction from database if it exists
      const transaction = await getTransactionByReference(reference);
      
      return res.render('payment-verification', {
        user: req.user,
        status: 'failed',
        message: 'Payment verification failed. Please contact support.',
        transaction,
        order: orderDetails.order
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).render('payment-verification', {
      user: req.user,
      status: 'failed',
      message: 'An error occurred during payment verification',
      transaction: null,
      order: null
    });
  }
};

// Controller to get a single order by ID
const getOrder = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    
    // Only allow user to access their own order
    if (order.order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(order);
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Controller to get all orders for the logged-in user with pagination
const getMyOrders = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    
    const result = await getUserOrders(req.user.id, page, limit);
    res.json(result);
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Export all order controllers
module.exports = {
  checkout,
  getOrder,
  getMyOrders,
  getCheckoutPage,
  verifyPayment
};