// Admin CSRF Protection
document.addEventListener('DOMContentLoaded', function() {
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    
    // Add CSRF token to all fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        // Only add for POST, PUT, DELETE, PATCH requests
        if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
            options.headers = options.headers || {};
            options.headers['CSRF-Token'] = csrfToken;
        }
        return originalFetch(url, options);
    };
    
    // Add CSRF token to all forms
    document.querySelectorAll('form').forEach(form => {
        // Skip if form already has CSRF token
        if (!form.querySelector('input[name="_csrf"]')) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_csrf';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }
    });
    
    // Add CSRF token to XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        const method = arguments[0];
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
            this.addEventListener('readystatechange', function() {
                if (this.readyState === 1) { // OPENED
                    this.setRequestHeader('CSRF-Token', csrfToken);
                }
            });
        }
        return originalOpen.apply(this, arguments);
    };
});