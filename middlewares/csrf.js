// CSRF middleware setup for Express
const csurf = require('csurf');

module.exports = csurf({ cookie: true });
