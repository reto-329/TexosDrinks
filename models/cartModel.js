const { query } = require('../config/db');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { getSetting } = require('./settingsModel');

// These will be loaded from the database
let FREE_DELIVERY_THRESHOLD = 100000;
let DELIVERY_FEE = 0;

// Function to load delivery settings from database
const loadDeliverySettings = async () => {
  try {
    const thresholdSetting = await getSetting('FREE_DELIVERY_THRESHOLD');
    const feeSetting = await getSetting('DELIVERY_FEE');
    
    if (thresholdSetting) {
      FREE_DELIVERY_THRESHOLD = parseFloat(thresholdSetting.value);
    }
    
    if (feeSetting) {
      DELIVERY_FEE = parseFloat(feeSetting.value);
    }
  } catch (error) {
    console.error('Error loading delivery settings:', error);
    // Use defaults if there's an error
  }
};

// Load settings when the module is first required
loadDeliverySettings();

const getOrCreateCart = async (user_id) => {
  const result = await query(
    `INSERT INTO carts (user_id) 
     VALUES ($1) 
     ON CONFLICT (user_id) 
     DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [user_id]
  );
  return result.rows[0];
};

const getCartItems = async (cart_id) => {
  const result = await query(`
    SELECT 
      ci.id,
      ci.quantity,
      p.id as product_id,
      p.name,
      p.description,
      p.price,
      p.stock,
      (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as image_url,
      c.name as category_name,
      (p.price * ci.quantity) as item_total
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE ci.cart_id = $1
    ORDER BY ci.created_at DESC
  `, [cart_id]);
  
  return result.rows;
};

const calculateCartTotals = async (items) => {
  // Reload settings to ensure we have the latest values
  await loadDeliverySettings();
  
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.item_total), 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    deliveryFee: parseFloat(deliveryFee.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    freeDeliveryProgress: Math.min(subtotal / FREE_DELIVERY_THRESHOLD, 1),
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD
  };
};

const addToCart = async (cart_id, product_id, quantity = 1) => {
  // Validate product exists and is in stock
  const productResult = await query(
    'SELECT * FROM products WHERE id = $1',
    [product_id]
  );
  
  if (productResult.rows.length === 0) {
    throw new NotFoundError('Product not found or unavailable');
  }

  const product = productResult.rows[0];
  
  if (product.stock < quantity) {
    if (product.stock === 0) {
      throw new BadRequestError('This product is out of stock');
    } else {
      throw new BadRequestError(`Only ${product.stock} items available in stock`);
    }
  }

  // Check if item exists in cart
  const existingItem = await query(
    'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cart_id, product_id]
  );

  let updatedItem;
  
  if (existingItem.rows.length > 0) {
    const newQuantity = existingItem.rows[0].quantity + quantity;
    
    if (newQuantity > product.stock) {
      if (product.stock === 0) {
        throw new BadRequestError('This product is out of stock');
      } else if (existingItem.rows[0].quantity >= product.stock) {
        throw new BadRequestError('This product is out of stock');
      } else {
        const remaining = product.stock - existingItem.rows[0].quantity;
        throw new BadRequestError(`Only ${remaining} more item(s) can be added to cart`);
      }
    }

    updatedItem = await query(
      `UPDATE cart_items 
       SET quantity = $1, updated_at = NOW() 
       WHERE cart_id = $2 AND product_id = $3 
       RETURNING *`,
      [newQuantity, cart_id, product_id]
    );
  } else {
    updatedItem = await query(
      `INSERT INTO cart_items (cart_id, product_id, quantity) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [cart_id, product_id, quantity]
    );
  }

  return updatedItem.rows[0];
};

const updateCartItem = async (cart_id, product_id, quantity) => {
  if (quantity < 1) {
    throw new BadRequestError('Quantity must be at least 1');
  }

  const productResult = await query(
    'SELECT stock FROM products WHERE id = $1',
    [product_id]
  );

  if (productResult.rows.length === 0) {
    throw new NotFoundError('Product not found');
  }

  if (quantity > productResult.rows[0].stock) {
    throw new BadRequestError(`Only ${productResult.rows[0].stock} items available`);
  }

  const result = await query(
    `UPDATE cart_items 
     SET quantity = $1, updated_at = NOW() 
     WHERE cart_id = $2 AND product_id = $3 
     RETURNING *`,
    [quantity, cart_id, product_id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Item not found in cart');
  }

  return result.rows[0];
};

const removeFromCart = async (cart_id, product_id) => {
  const result = await query(
    `DELETE FROM cart_items 
     WHERE cart_id = $1 AND product_id = $2 
     RETURNING *`,
    [cart_id, product_id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Item not found in cart');
  }

  return result.rows[0];
};

const clearCart = async (cart_id) => {
  await query('DELETE FROM cart_items WHERE cart_id = $1', [cart_id]);
};

module.exports = {
  getOrCreateCart,
  getCartItems,
  calculateCartTotals,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};