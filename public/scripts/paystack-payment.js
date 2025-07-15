/**
 * Paystack Payment Handler
 * 
 * This script handles Paystack payment initialization and verification
 */

// Initialize Paystack payment
async function initializePayment(email, amount, orderId) {
  try {
    // Show loading state
    const paymentButton = document.getElementById('paymentButton');
    if (paymentButton) {
      paymentButton.disabled = true;
      paymentButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    // Call backend to initialize payment
    const response = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, amount, orderId })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to initialize payment');
    }
    
    // Open Paystack payment modal
    const handler = PaystackPop.setup({
      key: paystackPublicKey, // This should be set in the HTML
      email: email,
      amount: amount * 100, // Amount in kobo
      ref: data.data.reference,
      callback: function(response) {
        // Redirect to verification page
        window.location.href = `/payment/verify/${response.reference}?order_id=${orderId}`;
      },
      onClose: function() {
        // Re-enable button
        if (paymentButton) {
          paymentButton.disabled = false;
          paymentButton.innerHTML = '<i class="fas fa-lock"></i> Pay';
        }
        
        console.log('Payment window closed');
      }
    });
    
    handler.openIframe();
  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment error: ' + error.message);
    
    // Re-enable button
    const paymentButton = document.getElementById('paymentButton');
    if (paymentButton) {
      paymentButton.disabled = false;
      paymentButton.innerHTML = '<i class="fas fa-lock"></i> Pay';
    }
  }
}

// Verify payment status
async function verifyPayment(reference, orderId) {
  try {
    const response = await fetch(`/api/paystack/verify/${reference}`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
}