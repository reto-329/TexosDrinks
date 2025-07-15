/**
 * CSRF Protection Utility
 * 
 * This script automatically adds CSRF tokens to all AJAX requests.
 * It should be included in all pages that make AJAX requests.
 */

(function() {
  // Get CSRF token from meta tag or hidden input
  function getCsrfToken() {
    // Try to get from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    
    // Try to get from hidden input
    const inputTag = document.getElementById('csrfToken');
    if (inputTag) {
      return inputTag.value;
    }
    
    return null;
  }
  
  // Add CSRF token to all AJAX requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    // Clone options to avoid modifying the original
    options = { ...options };
    options.headers = { ...options.headers } || {};
    
    // Add CSRF token to headers if not already present
    const csrfToken = getCsrfToken();
    if (csrfToken && !options.headers['x-csrf-token']) {
      options.headers['x-csrf-token'] = csrfToken;
    }
    
    // Call original fetch
    return originalFetch(url, options);
  };
  
  // Add CSRF token to all XMLHttpRequest requests
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    const method = arguments[0];
    const url = arguments[1];
    
    // Call original open
    originalOpen.apply(this, arguments);
    
    // Add event listener to set CSRF token before sending
    this.addEventListener('readystatechange', function() {
      if (this.readyState === 1) { // OPENED
        const csrfToken = getCsrfToken();
        if (csrfToken && !this.getRequestHeader('x-csrf-token')) {
          this.setRequestHeader('x-csrf-token', csrfToken);
        }
      }
    });
  };
  
  // Helper method to check if header is already set
  XMLHttpRequest.prototype.getRequestHeader = function(name) {
    // This is not a standard method, but we're adding it for our use
    return this._requestHeaders ? this._requestHeaders[name.toLowerCase()] : null;
  };
  
  // Store headers for later reference
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    // Initialize headers object if not exists
    if (!this._requestHeaders) {
      this._requestHeaders = {};
    }
    
    // Store header
    this._requestHeaders[name.toLowerCase()] = value;
    
    // Call original setRequestHeader
    originalSetRequestHeader.apply(this, arguments);
  };
})();