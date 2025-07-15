const express = require('express');
const router = express.Router();
const {
  createNewProduct,
  getProducts,
  getCategoryProducts,
  getProduct,
  getNewArrivals,
  updateProductDetails,
  removeProduct,
  getEditProduct,
  updateProductAjax,
  deleteProductAjax
} = require('../controllers/productController');
const { adminProtect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { getProductById, getAllProducts } = require('../models/productModel');

// Public routes
router.get('/', async (req, res) => {
    if (req.query.ids) {
        const ids = req.query.ids.split(',').map(id => parseInt(id));
        const products = await Promise.all(ids.map(id => getProductById(id)));
        // Flatten and filter nulls
        res.json(products.filter(Boolean));
    } else {
        const products = await getAllProducts();
        res.json(products);
    }
});
router.get('/category/:category_id', getCategoryProducts);
router.get('/:id', getProduct);
router.get('/new', getNewArrivals);

// Admin routes
router.post(
  '/productCreate',
  adminProtect,
  upload.single('image'), // Use multer's single image upload middleware
  createNewProduct
);

router.put('/admin/:id', adminProtect, updateProductDetails);
router.delete('/admin/:id', adminProtect, removeProduct);

// Admin AJAX edit/delete routes
router.get('/admin/products/edit/:id', adminProtect, getEditProduct);
router.post('/admin/products/edit/:id', adminProtect, upload.single('image'), updateProductAjax);
router.delete('/admin/products/delete/:id', adminProtect, deleteProductAjax);

module.exports = router;