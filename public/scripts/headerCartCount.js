// public/scripts/headerCartCount.js
// Updates the cart count in the header for logged-in users

async function updateLoggedInCartCount() {
  try {
    const res = await fetch('/api/cart', { credentials: 'same-origin' });
    const data = await res.json();
    if (data.success && data.data && Array.isArray(data.data.items)) {
      const count = data.data.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
      
      // Update all cart count elements (there might be multiple in different headers)
      const cartCountElements = document.querySelectorAll('.cart-count, .cart-counter, #cartCount');
      cartCountElements.forEach(el => {
        if (el) {
          const oldCount = parseInt(el.textContent) || 0;
          el.textContent = count;
          el.style.display = count > 0 ? 'flex' : 'none';
          
          // Add animation if count changed
          if (count !== oldCount) {
            el.classList.add('bounce');
            setTimeout(() => el.classList.remove('bounce'), 500);
          }
        }
      });
      
      return count; // Return the count for other functions that might need it
    }
    return 0;
  } catch (err) {
    console.error('Error updating cart count:', err);
    return 0;
  }
}

document.addEventListener('DOMContentLoaded', updateLoggedInCartCount);

// Function to add item to cart with notification
async function addToCartWithNotification(productId, quantity = 1) {
  try {
    // Check if user is logged in
    const userMeta = document.querySelector('meta[name="user-logged-in"]');
    const isLoggedIn = userMeta && userMeta.content === 'true';
    
    if (isLoggedIn) {
      // Add to user's cart in database
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item to cart');
      }
      
      // Update cart count
      await updateLoggedInCartCount();
      
      // Show success notification
      showCartNotification('Item added to cart successfully!', 'success');
    } else {
      // For guest users, handle in guestCart.js
      console.warn('User not logged in, cart operation should be handled by guestCart.js');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    showCartNotification(error.message || 'Failed to add item to cart', 'error');
  }
}

// Export functions for use in other scripts
window.updateLoggedInCartCount = updateLoggedInCartCount;
window.addToCartWithNotification = addToCartWithNotification;
