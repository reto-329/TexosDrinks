// This middleware disables browser caching for protected pages
const nocache = require('../middlewares/nocache');

module.exports = (router, protectMiddleware) => {
  // Apply to all routes in this router
  router.use(protectMiddleware, nocache);
};
