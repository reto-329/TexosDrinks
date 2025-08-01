const { query } = require('../config/db');
const cloudinary = require('../config/cloudinary');

const createProduct = async (name, description, price, stock, category_id, is_new, images = []) => {
  try {
    await query('BEGIN');
    
    const productResult = await query(
      'INSERT INTO products (name, description, price, stock, category_id, is_new) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, stock, category_id, is_new]
    );
    
    const product = productResult.rows[0];
    
    if (images.length > 0) {
      for (const image of images) {
        await query(
          'INSERT INTO product_images (product_id, image_url, public_id) VALUES ($1, $2, $3)',
          [product.id, image.url, image.public_id]
        );
      }
    }
    
    await query('COMMIT');
    return product;
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

const getAllProducts = async () => {
  const result = await query(`
    SELECT p.*, c.name as category_name 
    FROM products p
    JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `);
  return result.rows;
};

const getProductsByCategory = async (category_id) => {
  const result = await query(`
    SELECT p.*, c.name as category_name,
    (SELECT array_agg(json_build_object('url', pi.image_url, 'public_id', pi.public_id)) 
     FROM product_images pi WHERE pi.product_id = p.id) as images
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.category_id = $1
    ORDER BY p.created_at DESC
  `, [category_id]);
  return result.rows;
};

const getProductById = async (id) => {
  const result = await query(`
    SELECT 
      p.*, 
      c.name as category_name,
      (SELECT json_agg(json_build_object('url', pi.image_url, 'public_id', pi.public_id)) 
       FROM product_images pi WHERE pi.product_id = p.id) as images
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const product = result.rows[0];
  
  // Normalize images to prevent issues with nulls
  if (!product.images || (product.images.length === 1 && product.images[0] === null)) {
    product.images = [];
  }
  
  product.reviews = []; // Ensure reviews is an array

  return product;
};

const updateProduct = async (id, name, description, price, stock, category_id, is_new) => {
  const result = await query(
    'UPDATE products SET name = $1, description = $2, price = $3, stock = $4, category_id = $5, is_new = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
    [name, description, price, stock, category_id, is_new, id]
  );
  return result.rows[0];
};

const deleteProduct = async (id) => {
  // Check if product is referenced in order_items
  const orderCheck = await query('SELECT COUNT(*) as count FROM order_items WHERE product_id = $1', [id]);
  
  if (parseInt(orderCheck.rows[0].count) > 0) {
    throw new Error('Cannot delete product that has been ordered. Product is referenced in existing orders.');
  }
  
  // Check if product is referenced in cart_items
  const cartCheck = await query('SELECT COUNT(*) as count FROM cart_items WHERE product_id = $1', [id]);
  
  if (parseInt(cartCheck.rows[0].count) > 0) {
    // Remove from all carts first
    await query('DELETE FROM cart_items WHERE product_id = $1', [id]);
  }
  
  // Get all image public_ids to delete from Cloudinary
  const images = await query('SELECT public_id FROM product_images WHERE product_id = $1', [id]);
  
  // Delete from Cloudinary
  for (const image of images.rows) {
    await cloudinary.uploader.destroy(image.public_id);
  }
  
  // Then delete from database
  await query('DELETE FROM products WHERE id = $1', [id]);
};

const getNewProducts = async () => {
  const result = await query(`
    SELECT p.*, c.name as category_name 
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_new = true
    ORDER BY p.created_at DESC
    LIMIT 10
  `);
  return result.rows;
};

const getCategoryNameById = async (category_id) => {
  const result = await query('SELECT name FROM categories WHERE id = $1', [category_id]);
  return result.rows[0]?.name;
};

const getAllCategories = async () => {
  const result = await query('SELECT id, name FROM categories ORDER BY name');
  return result.rows;
};

// Update product with new image (replace old image)
const updateProductWithImage = async (id, name, description, price, stock, category_id, is_new, images) => {
  await query('BEGIN');
  try {
    // Remove old images from DB
    await query('DELETE FROM product_images WHERE product_id = $1', [id]);
    
    // Update product info
    const result = await query(
      'UPDATE products SET name = $1, description = $2, price = $3, stock = $4, category_id = $5, is_new = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, description, price, stock, category_id, is_new, id]
    );
    
    // Insert new image(s)
    if (images && images.length > 0) {
      for (const image of images) {
        await query(
          'INSERT INTO product_images (product_id, image_url, public_id) VALUES ($1, $2, $3)',
          [id, image.url, image.public_id]
        );
      }
    }
    
    await query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// Reduce product stock when order is paid
const reduceProductStock = async (product_id, quantity) => {
  console.log(`Attempting to reduce stock for product ${product_id} by ${quantity}`);
  
  // First check current stock
  const currentStock = await query('SELECT stock FROM products WHERE id = $1', [product_id]);
  if (currentStock.rows.length === 0) {
    console.log(`Product ${product_id} not found`);
    return null;
  }
  
  console.log(`Current stock for product ${product_id}: ${currentStock.rows[0].stock}`);
  
  const result = await query(
    'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING *',
    [quantity, product_id]
  );
  
  if (result.rows.length === 0) {
    console.log(`Failed to reduce stock for product ${product_id} - insufficient stock`);
    return null;
  }
  
  console.log(`Successfully reduced stock for product ${product_id}. New stock: ${result.rows[0].stock}`);
  return result.rows[0];
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductsByCategory,
  getProductById,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getCategoryNameById,
  getAllCategories,
  updateProductWithImage,
  reduceProductStock,
};