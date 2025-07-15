// Check if PAYSTACK_SECRET_KEY is defined
if (!process.env.PAYSTACK_SECRET_KEY) {
  console.error('PAYSTACK_SECRET_KEY is not defined in environment variables');
}

const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder');
const { query } = require('../config/db');

/**
 * Initialize a Paystack transaction
 * @param {Object} data - Transaction data
 * @param {string} data.email - Customer email
 * @param {number} data.amount - Amount in kobo (Naira * 100)
 * @param {Object} data.metadata - Additional transaction data
 * @returns {Promise<Object>} - Paystack response
 */
const initializeTransaction = async (data) => {
  try {
    // Generate a reference if not provided
    const reference = data.reference || 'TX' + Math.floor(Math.random() * 1000000000) + Date.now();
    
    const response = await paystack.transaction.initialize({
      email: data.email,
      amount: data.amount * 100, // Convert to kobo
      metadata: data.metadata,
      reference: reference,
      callback_url: data.callback_url || process.env.PAYSTACK_CALLBACK_URL,
      currency: 'NGN',
      channels: ['card']
    });
    
    if (!response || !response.data) {
      throw new Error('Invalid response from Paystack API');
    }
    
    return response;
  } catch (error) {
    console.error('Paystack initialization error:', error);
    throw new Error('Payment initialization failed: ' + error.message);
  }
};

/**
 * Verify a Paystack transaction
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} - Verified transaction data
 */
const verifyTransaction = async (reference) => {
  try {
    const response = await paystack.transaction.verify(reference);
    return response;
  } catch (error) {
    console.error('Paystack verification error:', error);
    throw new Error('Payment verification failed: ' + error.message);
  }
};

/**
 * Save transaction to database
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<Object>} - Saved transaction
 */
const saveTransaction = async (transactionData) => {
  const { 
    order_id, 
    reference, 
    amount, 
    status, 
    customer_email, 
    metadata 
  } = transactionData;

  const result = await query(
    `INSERT INTO transactions 
     (order_id, paystack_reference, amount, status, customer_email, metadata) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [order_id, reference, amount, status, customer_email, JSON.stringify(metadata)]
  );

  return result.rows[0];
};

/**
 * Update transaction status in database
 * @param {string} reference - Transaction reference
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated transaction
 */
const updateTransactionStatus = async (reference, status) => {
  const result = await query(
    `UPDATE transactions 
     SET status = $1, updated_at = NOW() 
     WHERE paystack_reference = $2 
     RETURNING *`,
    [status, reference]
  );

  return result.rows[0];
};

/**
 * Get transaction by reference
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} - Transaction data
 */
const getTransactionByReference = async (reference) => {
  const result = await query(
    'SELECT * FROM transactions WHERE paystack_reference = $1',
    [reference]
  );

  return result.rows[0];
};

/**
 * Get transaction by order ID
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} - Transaction data
 */
const getTransactionByOrderId = async (orderId) => {
  const result = await query(
    'SELECT * FROM transactions WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
    [orderId]
  );

  return result.rows[0];
};

module.exports = {
  initializeTransaction,
  verifyTransaction,
  saveTransaction,
  updateTransactionStatus,
  getTransactionByReference,
  getTransactionByOrderId
};