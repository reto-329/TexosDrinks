const express = require('express');
const router = express.Router();
const { renderUserProducts, renderProductDetails } = require('../controllers/userProductController');
const { userAuth } = require('../middlewares/auth');

// User-facing products page - authentication is optional
router.get('/products', userAuth, renderUserProducts);

// Product details page - authentication is optional
router.get('products/:id', userAuth, renderProductDetails);

// Redirect /product to /products for any legacy links
router.get('/product', (req, res) => {
    res.redirect('/products');
});

module.exports = router;
