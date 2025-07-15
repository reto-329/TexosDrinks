const {
  createProduct,
  getAllProducts,
  getProductsByCategory,
  getProductById,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getCategoryNameById,
  getAllCategories
} = require('../models/productModel');
const { adminProtect } = require('../middlewares/auth');
const cloudinary = require('../config/cloudinary');
const upload = require('../middlewares/upload');

const createNewProduct = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Log incoming data
    console.log('File:', req.file); // Log file info

    const { name, description, price, stock, category_id, is_new } = req.body;
    
    if (!name || !price || !category_id) {
      console.error('Missing required fields');
      return res.status(400).json({ 
        message: 'Please provide required fields: name, price, and category' 
      });
    }

    const categoryName = await getCategoryNameById(category_id);
    if (!categoryName) {
      console.error('Invalid category ID:', category_id);
      return res.status(400).json({ message: 'Invalid category' });
    }

    let images = [];
    if (req.file) {
      try {
        const folderName = `products/${categoryName.toLowerCase().replace(/\s+/g, '_')}`;
        console.log('Uploading to folder:', folderName);
        
        const result = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          {
            folder: folderName,
            resource_type: 'image',
            timeout: 30000 // 30 seconds timeout
          }
        );
        
        // Only allow one image
        images = [{
          url: result.secure_url,
          public_id: result.public_id
        }];
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload image to Cloudinary',
          error: uploadError.message 
        });
      }
    }

    const product = await createProduct(
      name,
      description,
      price,
      stock || 0,
      category_id,
      is_new || false,
      images // always an array with one object
    );
    
    console.log('Product created successfully:', product.id);
    res.status(201).json(product);
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCategoryProducts = async (req, res) => {
  try {
    const products = await getProductsByCategory(req.params.category_id);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProductDetails = async (req, res) => {
  try {
    const { name, description, price, stock, category_id, is_new } = req.body;
    
    if (!name || !price || !category_id) {
      return res.status(400).json({ message: 'Please provide required fields' });
    }
    
    const product = await updateProduct(
      req.params.id,
      name,
      description,
      price,
      stock,
      category_id,
      is_new
    );
    
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const removeProduct = async (req, res) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getNewArrivals = async (req, res) => {
  try {
    const products = await getNewProducts();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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

// Edit product (render edit form as JSON for popup)
const getEditProduct = async (req, res) => {
  const productId = req.params.id;
  const product = await require('../models/productModel').getProductById(productId);
  const categories = await require('../models/categoryModel').getAllCategories();
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ product, categories });
};

// Handle product update (AJAX, with image upload and Cloudinary replace)
const multer = require('multer');
const storage = multer.memoryStorage();
exports.upload = upload;
const updateProductAjax = async (req, res) => {
  const productId = req.params.id;
  const { name, description, price, stock, category_id, is_new } = req.body;
  
  try {
    // 1. Get the current product (to get old image data)
    const product = await require('../models/productModel').getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get current images (default to empty array if none exist)
    let currentImages = product.images || [];
    
    // If new image uploaded
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (currentImages.length > 0 && currentImages[0].public_id) {
        await cloudinary.uploader.destroy(currentImages[0].public_id);
      }

      // Upload new image
      const categoryName = await getCategoryNameById(category_id);
      const folderName = `products/${categoryName.toLowerCase().replace(/\s+/g, '_')}`;
      
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: folderName,
          resource_type: 'image'
        }
      );

      // Replace with new image
      currentImages = [{
        url: result.secure_url,
        public_id: result.public_id
      }];
    }

    // If no new image is uploaded, just update the product details without touching the image
    if (!req.file) {
      const updatedProduct = await require('../models/productModel').updateProduct(
        productId,
        name,
        description,
        price,
        stock,
        category_id,
        is_new === 'on' || is_new === true
      );
      return res.json({ success: true, product: updatedProduct });
    }

    // If a new image is uploaded, handle the image replacement logic
    const categoryName = await getCategoryNameById(category_id);
    if (!categoryName) {
      return res.status(400).json({ error: 'Invalid category specified.' });
    }
    const folderName = `products/${categoryName.toLowerCase().replace(/\s+/g, '_')}`;

    // Delete old image from Cloudinary if it exists
    if (currentImages.length > 0 && currentImages[0].public_id) {
      await cloudinary.uploader.destroy(currentImages[0].public_id);
    }

    // Upload new image
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      {
        folder: folderName,
        resource_type: 'image'
      }
    );

    // Create the new image data array
    const newImages = [{
      url: result.secure_url,
      public_id: result.public_id
    }];

    // Update product in the database with the new image
    const updatedProductWithNewImage = await require('../models/productModel').updateProductWithImage(
      productId,
      name,
      description,
      price,
      stock,
      category_id,
      is_new === 'on' || is_new === true,
      newImages
    );

    if (!updatedProductWithNewImage) {
      return res.status(400).json({ error: 'Failed to update product with new image' });
    }

    res.json({ success: true, product: updatedProductWithNewImage });
    
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      error: 'Error updating product',
      message: error.message 
    });
  }
};

// Handle product delete (AJAX)
const deleteProductAjax = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await require('../models/productModel').getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // Delete all images from Cloudinary
    const imageArr = product.images || [];
    const cloudinary = require('../config/cloudinary');
    for (const img of imageArr) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }
    await require('../models/productModel').deleteProduct(productId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting product' });
  }
};

// Render all products page with filters, search, sort, pagination
const getAllProductsPage = async (req, res) => {
  try {
    const { search = '', category = 'all', sort = 'name', price = 5000, page = 1 } = req.query;
    const limit = 12;
    const offset = (parseInt(page) - 1) * limit;
    const categories = await getAllCategories();

    // Build filter SQL
    let filterSql = 'WHERE 1=1';
    let params = [];
    let idx = 1;
    if (search) {
      filterSql += ` AND LOWER(p.name) LIKE $${idx++}`;
      params.push(`%${search.toLowerCase()}%`);
    }
    if (category !== 'all') {
      filterSql += ` AND p.category_id = $${idx++}`;
      params.push(category);
    }
    if (price < 5000) {
      filterSql += ` AND p.price <= $${idx++}`;
      params.push(price);
    }

    // Sorting
    let sortSql = 'ORDER BY ';
    if (sort === 'priceLow') sortSql += 'p.price ASC';
    else if (sort === 'priceHigh') sortSql += 'p.price DESC';
    else if (sort === 'newest') sortSql += 'p.created_at DESC';
    else sortSql += 'p.name ASC';

    // Count for pagination
    const countResult = await require('../config/db').query(
      `SELECT COUNT(*) FROM products p ${filterSql}`,
      params
    );
    const totalProducts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalProducts / limit);

    // Get products
    const productsResult = await require('../config/db').query(
      `SELECT p.*, c.name as categoryName,
        (SELECT array_agg(pi.image_url) FROM product_images pi WHERE pi.product_id = p.id) as images
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ${filterSql}
      ${sortSql}
      LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    const products = productsResult.rows.map(prod => ({
      ...prod,
      images: prod.images && prod.images[0] ? prod.images : [],
      inStock: prod.stock > 0,
    }));

    res.render('products', {
      user: res.locals.user || null,
      products,
      categories,
      stats: { totalProducts, categories: categories.length },
      query: { search, category, sort, price, page },
      totalProducts,
      totalPages,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('products', {
      user: res.locals.user || null,
      products: [],
      categories: [],
      stats: { totalProducts: 0, categories: 0 },
      query: {},
      totalProducts: 0,
      totalPages: 1,
      currentPage: 1,
      error: 'Failed to load products',
    });
  }
};

// Render product details page
const getProductDetailsPage = async (req, res) => {
  try {
    const productId = req.params.id;
    const productResult = await require('../models/productModel').getProductById(productId);
    if (!productResult) {
      return res.render('productDetails', { user: res.locals.user || null, product: null, notFound: true });
    }
    let images = [];
    if (productResult.images && Array.isArray(productResult.images)) {
      images = productResult.images.map(img => (img.url ? img.url : img));
    }
    const product = {
      ...productResult,
      images,
      inStock: productResult.stock > 0,
      categoryName: productResult.category_name || '',
    };
    res.render('productDetails', { user: res.locals.user || null, product, notFound: false });
  } catch (error) {
    console.error(error);
    res.render('productDetails', { user: res.locals.user || null, product: null, notFound: true });
  }
};

// Export all controller functions, including AJAX and upload
module.exports = {
  createNewProduct,
  getProducts,
  getCategoryProducts,
  getProduct,
  updateProductDetails,
  removeProduct,
  getNewArrivals,
  getCategories,
  getEditProduct,
  updateProductAjax,
  deleteProductAjax,
  upload,
  getAllProductsPage,
  getProductDetailsPage,
};