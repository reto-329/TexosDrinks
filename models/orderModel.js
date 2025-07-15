// Import database query helper
const { query } = require('../config/db');

// Get all order statuses
const getAllOrderStatuses = async () => {
  const result = await query('SELECT * FROM order_status ORDER BY id');
  return result.rows;
};

// Get order status by name
const getOrderStatusByName = async (statusName) => {
  const result = await query('SELECT * FROM order_status WHERE name = $1', [statusName]);
  return result.rows[0];
};

// Create a new order
const createOrder = async (user_id, total_amount, address_id = null) => {
  // Get the 'pending' status ID
  const pendingStatus = await getOrderStatusByName('pending');
  
  const result = await query(
    'INSERT INTO orders (user_id, total_amount, address_id, status_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [user_id, total_amount, address_id, pendingStatus.id]
  );
  return result.rows[0];
};

// Update order status
const updateOrderStatus = async (order_id, statusName) => {
  // Get the status ID for the given status name
  const status = await getOrderStatusByName(statusName);
  if (!status) {
    throw new Error(`Invalid order status: ${statusName}`);
  }
  
  const result = await query(
    'UPDATE orders SET status_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status.id, order_id]
  );
  return result.rows[0];
};

// Add an item to an order
const addOrderItems = async (order_id, product_id, quantity, price) => {
  await query(
    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
    [order_id, product_id, quantity, price]
  );
};

// Get an order and its items by order ID
const getOrderById = async (id) => {
  const orderResult = await query(`
    SELECT o.*, os.name as status_name, os.description as status_description
    FROM orders o
    LEFT JOIN order_status os ON o.status_id = os.id
    WHERE o.id = $1
  `, [id]);
  
  if (orderResult.rows.length === 0) {
    throw new Error('Order not found');
  }
  
  // Get all items for this order
  const itemsResult = await query(`
    SELECT oi.*, p.name, p.description, c.name as category_name,
    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id LIMIT 1) as image_url
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE oi.order_id = $1
  `, [id]);
  
  // Return order and its items
  return {
    order: orderResult.rows[0],
    items: itemsResult.rows,
  };
};

// Get all orders for a user, including their items with pagination
const getUserOrders = async (user_id, page = 1, limit = 5) => {
  // Calculate offset based on page and limit
  const offset = (page - 1) * limit;
  
  // Get total count of user's orders
  const countResult = await query('SELECT COUNT(*) as total FROM orders WHERE user_id = $1', [user_id]);
  const total = parseInt(countResult.rows[0].total, 10);
  
  // Get paginated orders
  const ordersResult = await query(`
    SELECT o.*, os.name as status_name, os.description as status_description
    FROM orders o
    LEFT JOIN order_status os ON o.status_id = os.id
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC
    LIMIT $2 OFFSET $3
  `, [user_id, limit, offset]);
  
  // For each order, get its items
  const ordersWithItems = await Promise.all(
    ordersResult.rows.map(async (order) => {
      const itemsResult = await query(`
        SELECT oi.*, p.name, p.description, c.name as category_name,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id LIMIT 1) as image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE oi.order_id = $1
      `, [order.id]);
      
      return {
        ...order,
        items: itemsResult.rows,
      };
    })
  );
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  
  return {
    orders: ordersWithItems,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
};

// Get total order count
const getOrderCount = async () => {
  const result = await query('SELECT COUNT(*) as count FROM orders');
  return parseInt(result.rows[0].count, 10);
};

// Get order count for a specific user
const getUserOrderCount = async (userId) => {
  const result = await query('SELECT COUNT(*) as count FROM orders WHERE user_id = $1', [userId]);
  return parseInt(result.rows[0].count, 10);
};

// Export all order functions
module.exports = {
  createOrder,
  addOrderItems,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  getAllOrderStatuses,
  getOrderStatusByName,
  getOrderCount,
  getUserOrderCount
};