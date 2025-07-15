const express = require('express');
const router = express.Router();
const {
  createNewCategory,
  getCategories,
  getCategory,
  updateCategoryDetails,
  removeCategory
} = require('../controllers/categoryController');
const { adminProtect } = require('../middlewares/auth');

// API Routes
router.get('/', adminProtect, getCategories);
router.post('/', adminProtect, createNewCategory);
router.get('/:id', adminProtect, getCategory);
router.put('/:id', adminProtect, updateCategoryDetails);
router.delete('/:id', adminProtect, removeCategory);

module.exports = router;