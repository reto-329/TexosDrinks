const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../models/categoryModel');
const { adminProtect } = require('../middlewares/auth');

const createNewCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Please provide category name' });
    }
    
    const category = await createCategory(name, description, icon);
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCategory = async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategoryDetails = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Please provide category name' });
    }
    
    const category = await updateCategory(req.params.id, name, description, icon);
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const removeCategory = async (req, res) => {
  try {
    await deleteCategory(req.params.id);
    res.json({ message: 'Category removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNewCategory,
  getCategories,
  getCategory,
  updateCategoryDetails,
  removeCategory,
};