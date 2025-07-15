/**
 * Paystack Modal Enhancer
 * This script improves the appearance of the Paystack payment modal
 */

document.addEventListener('DOMContentLoaded', function() {
  // Function to enhance Paystack modal
  function enhancePaystackModal() {
    // Check if Paystack iframe exists
    const paystackIframe = document.querySelector('iframe[src*="paystack"]');
    if (paystackIframe) {
      // Add our custom class
      paystackIframe.classList.add('paystack-iframe');
      
      // Find the container
      const container = paystackIframe.closest('div');
      if (container) {
        container.classList.add('paystack-container');
        
        // Find the overlay
        const overlay = container.parentElement;
        if (overlay) {
          overlay.classList.add('paystack-overlay');
          overlay.classList.add('paystack-wrapper');
        }
      }
    }
  }
  
  // Create a MutationObserver to watch for Paystack modal being added to the DOM
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if this is a Paystack iframe or container
            if (node.tagName === 'IFRAME' && node.src && node.src.includes('paystack')) {
              enhancePaystackModal();
            } else {
              // Check children for Paystack iframe
              const iframe = node.querySelector('iframe[src*="paystack"]');
              if (iframe) {
                enhancePaystackModal();
              }
            }
          }
        }
      }
    });
  });
  
  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});