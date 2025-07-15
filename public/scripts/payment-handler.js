/**
 * Payment Handler Script
 * Handles payment processing and verification
 */

// Show loading overlay during payment verification
function showPaymentProcessingOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'payment-processing-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(255,255,255,0.9)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '9999';
  
  const content = document.createElement('div');
  content.style.textAlign = 'center';
  content.style.padding = '30px';
  content.style.background = 'white';
  content.style.borderRadius = '10px';
  content.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  
  const spinner = document.createElement('div');
  spinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  spinner.style.fontSize = '40px';
  spinner.style.color = '#dc2626';
  spinner.style.marginBottom = '20px';
  
  const title = document.createElement('h2');
  title.textContent = 'Processing Payment';
  
  const message = document.createElement('p');
  message.textContent = 'Please wait while we verify your payment...';
  
  content.appendChild(spinner);
  content.appendChild(title);
  content.appendChild(message);
  overlay.appendChild(content);
  
  document.body.appendChild(overlay);
}

// Handle payment verification redirect with delay
function handlePaymentVerification(reference, orderId) {
  showPaymentProcessingOverlay();
  
  // Add a slight delay before redirecting
  setTimeout(function() {
    window.location.href = `/payment/verify/${reference}?order_id=${orderId}`;
  }, 1500);
}