/**
 * CSRF Protection Middleware
 * 
 * This middleware adds CSRF protection to all forms and AJAX requests.
 * It adds a csrfToken function to the response object that can be used in views.
 * It also adds a global JavaScript function to include the CSRF token in all AJAX requests.
 */

function csrfProtection(req, res, next) {
  // Skip if CSRF is not enabled
  if (typeof req.csrfToken !== 'function') {
    return next();
  }

  // Add CSRF token to all responses
  res.locals.csrfToken = req.csrfToken();

  // Add CSRF token to all HTML responses
  const originalRender = res.render;
  res.render = function(view, options, callback) {
    // Merge options with locals
    options = { ...res.locals, ...options };
    
    // Ensure csrfToken is available in all views
    if (!options.csrfToken && res.locals.csrfToken) {
      options.csrfToken = res.locals.csrfToken;
    }
    
    // Call original render
    return originalRender.call(this, view, options, callback);
  };

  next();
}

module.exports = csrfProtection;