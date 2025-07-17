// public/scripts/headerCartCount.js
// Updates the cart count in the header for both logged-in and guest users

// --- Logged-in User Cart ---
async function updateLoggedInCartCount() {
  try {
    const res = await fetch('/api/cart', { credentials: 'same-origin' });
    if (!res.ok) {
      // If the user is not authenticated, the server might return a 401/403
      // In this case, we shouldn't treat it as a critical error.
      if (res.status === 401 || res.status === 403) {
        console.log('User not logged in. Cart count will not be updated from server.');
        return 0;
      }
      throw new Error(`Server responded with status: ${res.status}`);
    }
    
    const data = await res.json();
    if (data.success && data.data && Array.isArray(data.data.items)) {
      const count = data.data.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
      updateCartDisplay(count);
      return count;
    }
    return 0;
  } catch (err) {
    console.error('Error updating logged-in cart count:', err);
    // Don't show an empty cart if the API fails, just log the error
    return -1; // Indicate failure
  }
}

// --- Guest User Cart ---
function getGuestCart() {
  try {
    const cart = localStorage.getItem('guestCart');
    return cart ? JSON.parse(cart) : { items: [] };
  } catch (e) {
    console.error("Error parsing guest cart:", e);
    return { items: [] }; // Return a default empty cart structure
  }
}

function updateGuestCartCount() {
  const guestCart = getGuestCart();
  const count = guestCart.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  updateCartDisplay(count);
  return count;
}

// --- UI Update Function ---
function updateCartDisplay(count) {
  if (typeof count !== 'number' || count < 0) return;

  const cartCountElements = document.querySelectorAll('.cart-count, .cart-counter, #cartCount');
  cartCountElements.forEach(el => {
    if (el) {
      const oldCount = parseInt(el.textContent) || 0;
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
      
      if (count !== oldCount) {
        el.classList.add('bounce');
        setTimeout(() => el.classList.remove('bounce'), 500);
      }
    }
  });
}

// --- Unified Cart Update Logic ---
async function updateCartCount() {
  const userMeta = document.querySelector('meta[name="user-logged-in"]');
  const isLoggedIn = userMeta && userMeta.content === 'true';

  if (isLoggedIn) {
    await updateLoggedInCartCount();
  } else {
    updateGuestCartCount();
  }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', updateCartCount);

// Listen for custom event to update cart count from other scripts
document.addEventListener('cartUpdated', updateCartCount);


// --- Add to Cart (for logged-in users) ---
async function addToCartWithNotification(productId, quantity = 1) {
  const userMeta = document.querySelector('meta[name="user-logged-in"]');
  const isLoggedIn = userMeta && userMeta.content === 'true';

  if (!isLoggedIn) {
    // This function should ideally not be called for guests.
    // The guest logic is in guestCart.js. We can trigger an update here as a fallback.
    console.warn('Guest user detected. Add to cart should be handled by guestCart.js.');
    // Ensure guest cart UI is up-to-date
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    return;
  }

  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ product_id: productId, quantity: quantity })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add item to cart');
    }
    
    await updateLoggedInCartCount(); // Update count after successful add
    showCartNotification('Item added to cart successfully!', 'success');

  } catch (error) {
    console.error('Error adding to cart:', error);
    showCartNotification(error.message || 'Failed to add item to cart', 'error');
  }
}

// --- Exports for global access ---
window.updateCartCount = updateCartCount;
window.addToCartWithNotification = addToCartWithNotification;

