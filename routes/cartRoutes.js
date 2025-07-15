const express = require('express');
const router = express.Router();
const {
  getCart,
  addItemToCart,
  updateItemInCart,
  removeItemFromCart,
  emptyCart
} = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  addToCartSchema,
  updateCartItemSchema
} = require('../validations/cartValidation');
const {
  getOrCreateCart,
  getCartItems,
  calculateCartTotals,
  addToCart
} = require('../models/cartModel');

// Get user's cart
router.get('/', protect, getCart);

// Add item to cart
router.post('/', protect, validate(addToCartSchema), addItemToCart);

// Update cart item quantity
router.put('/:product_id', protect, validate(updateCartItemSchema), updateItemInCart);

// Remove item from cart
router.delete('/:product_id', protect, removeItemFromCart);

// Clear entire cart
router.delete('/', protect, emptyCart);

// Merge guest cart items into user cart
router.post('/merge', protect, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ success: true, message: 'No guest cart items to merge.' });
    }
    
    // Get or create the user's cart
    const cart = await getOrCreateCart(req.user.id);
    let mergedCount = 0;
    let errorItems = [];
    
    // Process each item in the guest cart
    for (const item of items) {
      const productId = item.product_id || item.id; // Support both formats
      if (productId && item.quantity) {
        try {
          await addToCart(cart.id, productId, item.quantity);
          mergedCount++;
        } catch (itemError) {
          console.error(`Error adding item ${productId} to cart:`, itemError);
          errorItems.push({
            id: productId,
            error: itemError.message || 'Failed to add item'
          });
        }
      }
    }
    
    // Get the updated cart items
    const mergedItems = await getCartItems(cart.id);
    const totals = calculateCartTotals(mergedItems);
    
    res.json({ 
      success: true, 
      message: `Successfully merged ${mergedCount} items into your cart.`,
      data: { 
        cartId: cart.id, 
        items: mergedItems, 
        ...totals,
        mergedCount,
        errorItems: errorItems.length > 0 ? errorItems : undefined
      } 
    });
  } catch (error) {
    console.error('Merge guest cart error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to merge guest cart' });
  }
});

module.exports = router;