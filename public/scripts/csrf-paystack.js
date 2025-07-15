/**
 * CSRF Token handler for Paystack requests
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get CSRF token from meta tag
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  if (csrfToken) {
    // Add CSRF token to all fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      // Only add CSRF token to our own API endpoints
      if (url.toString().includes('/api/')) {
        options.headers = options.headers || {};
        options.headers['X-CSRF-Token'] = csrfToken;
      }
      return originalFetch.call(this, url, options);
    };
    
    console.log('CSRF protection enabled for API requests');
  } else {
    console.warn('CSRF token not found');
  }
});