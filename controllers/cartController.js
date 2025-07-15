const {
  getOrCreateCart,
  getCartItems,
  calculateCartTotals,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../models/cartModel');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const items = await getCartItems(cart.id);
    const totals = calculateCartTotals(items);
    
    res.json({
      success: true,
      data: {
        cartId: cart.id,
        items,
        ...totals
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get cart'
    });
  }
};

const addItemToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    
    if (!product_id) {
      throw new BadRequestError('Product ID is required');
    }

    const cart = await getOrCreateCart(req.user.id);
    await addToCart(cart.id, product_id, quantity);
    
    const items = await getCartItems(cart.id);
    const totals = calculateCartTotals(items);
    
    res.json({
      success: true,
      data: {
        cartId: cart.id,
        items,
        ...totals
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to add item to cart'
    });
  }
};

const updateItemInCart = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { product_id } = req.params;
    
    if (!quantity) {
      throw new BadRequestError('Quantity is required');
    }

    const cart = await getOrCreateCart(req.user.id);
    await updateCartItem(cart.id, product_id, quantity);
    
    const items = await getCartItems(cart.id);
    const totals = calculateCartTotals(items);
    
    res.json({
      success: true,
      data: {
        cartId: cart.id,
        items,
        ...totals
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to update cart item'
    });
  }
};

const removeItemFromCart = async (req, res) => {
  try {
    const { product_id } = req.params;
    const cart = await getOrCreateCart(req.user.id);
    
    await removeFromCart(cart.id, product_id);
    
    const items = await getCartItems(cart.id);
    const totals = calculateCartTotals(items);
    
    res.json({
      success: true,
      data: {
        cartId: cart.id,
        items,
        ...totals
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to remove item from cart'
    });
  }
};

const emptyCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await clearCart(cart.id);
    
    res.json({
      success: true,
      data: {
        message: 'Cart cleared successfully',
        cartId: cart.id,
        items: [],
        subtotal: 0,
        deliveryFee: 0,
        total: 0,
        freeDeliveryProgress: 0
      }
    });
  } catch (error) {
    console.error('Empty cart error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to clear cart'
    });
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateItemInCart,
  removeItemFromCart,
  emptyCart
};