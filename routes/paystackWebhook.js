// Webhook handler for Paystack events
const crypto = require('crypto');
const { updateTransactionStatus, getTransactionByReference } = require('../services/paystackService');
const { updateOrderStatus } = require('../models/orderModel');

// Map Paystack events to order statuses
const PAYSTACK_EVENT_TO_ORDER_STATUS = {
  'charge.success': 'paid',
  'charge.failed': 'cancelled',
  'charge.dispute.create': 'disputed',
  'charge.dispute.resolve': 'paid',
  'charge.dispute.remind': 'disputed',
  'charge.dispute.escalate': 'disputed',
  'charge.refund.pending': 'refund_pending',
  'charge.refund.processed': 'refunded',
  'charge.refund.failed': 'paid', // Refund failed, so order remains paid
  'charge.reversed': 'refunded'
};

// Process webhook events
async function processWebhook(req, res) {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
      console.error('Invalid Paystack webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }
    
    const event = req.body;
    console.log('Received Paystack webhook event:', event.event);
    
    // Get transaction reference from event data
    const reference = event.data?.reference;
    if (!reference) {
      console.warn('No transaction reference found in webhook event');
      return res.status(200).json({ received: true });
    }
    
    // Update transaction status in our database
    let transactionStatus = 'pending';
    let orderStatus = null;
    
    // Determine transaction and order status based on event type
    if (event.event.startsWith('charge.')) {
      if (event.event === 'charge.success') {
        transactionStatus = 'success';
      } else if (event.event === 'charge.failed') {
        transactionStatus = 'failed';
      } else if (event.event.includes('dispute')) {
        transactionStatus = 'disputed';
      } else if (event.event.includes('refund')) {
        transactionStatus = event.event.includes('failed') ? 'success' : 'refunded';
      } else if (event.event === 'charge.reversed') {
        transactionStatus = 'reversed';
      }
      
      // Get corresponding order status
      orderStatus = PAYSTACK_EVENT_TO_ORDER_STATUS[event.event];
    }
    
    // Update transaction status
    console.log(`Updating transaction ${reference} status to ${transactionStatus}`);
    const updatedTransaction = await updateTransactionStatus(reference, transactionStatus);
    
    // Update order status if we have a mapping and transaction exists
    if (orderStatus && updatedTransaction && updatedTransaction.order_id) {
      try {
        await updateOrderStatus(updatedTransaction.order_id, orderStatus);
        console.log(`Order status updated to ${orderStatus} for order ID: ${updatedTransaction.order_id}`);
      } catch (error) {
        console.error(`Failed to update order status to ${orderStatus} for order ID: ${updatedTransaction.order_id}`, error);
      }
    } else if (updatedTransaction && updatedTransaction.order_id) {
      console.log(`No order status mapping for event ${event.event}, order ID: ${updatedTransaction.order_id}`);
    } else {
      console.warn(`Transaction found but no order_id associated with reference: ${reference}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to Paystack to prevent retries
    // but log the error for investigation
    res.status(200).json({ received: true, error: 'Error processing webhook' });
  }
}

module.exports = processWebhook;