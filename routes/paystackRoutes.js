const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const processWebhook = require('./paystackWebhook');
const { 
  initializeTransaction, 
  verifyTransaction,
  saveTransaction,
  updateTransactionStatus,
  getTransactionByReference
} = require('../services/paystackService');
const { getOrderById } = require('../models/orderModel');

// Initialize payment
router.post('/initialize', protect, async (req, res) => {
  try {
    const { email, amount, orderId } = req.body;
    
    if (!email || !amount || !orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, amount and orderId are required' 
      });
    }

    // Get order details to include in metadata
    const orderDetails = await getOrderById(orderId);
    
    // Initialize transaction
    const response = await initializeTransaction({
      email,
      amount,
      metadata: {
        order_id: orderId,
        user_id: req.user.id,
        items_count: orderDetails.items.length
      }
    });
    
    // Check if response and data exist
    if (!response || !response.data || !response.data.reference) {
      throw new Error('Invalid response from Paystack');
    }
    
    // Save initial transaction record
    await saveTransaction({
      order_id: orderId,
      reference: response.data.reference,
      amount,
      status: 'pending',
      customer_email: email,
      metadata: {
        order_id: orderId,
        user_id: req.user.id
      }
    });
    
    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment initialization failed'
    });
  }
});

// Verify payment
router.get('/verify/:reference', protect, async (req, res) => {
  try {
    const { reference } = req.params;
    
    // Verify the transaction
    const response = await verifyTransaction(reference);
    
    if (response.data.status === 'success') {
      // Update transaction status in database
      await updateTransactionStatus(reference, 'success');
      
      // Return success response
      res.status(200).json({
        success: true,
        data: response.data
      });
    } else {
      // Update transaction status in database
      await updateTransactionStatus(reference, response.data.status);
      
      // Return status
      res.status(200).json({
        success: false,
        message: 'Payment was not successful',
        data: response.data
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
});

// Webhook to receive Paystack events
router.post('/webhook', processWebhook);

module.exports = router;