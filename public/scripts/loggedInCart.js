// public/scripts/loggedInCart.js
// Handles cart rendering and actions for logged-in users

document.addEventListener('DOMContentLoaded', function() {
  const userMeta = document.querySelector('meta[name="user-logged-in"]');
  const isLoggedIn = userMeta && userMeta.content === 'true';
  if (!isLoggedIn) return;

  const cartSection = document.querySelector('.cart-section');
  const cartItemsContainer = document.querySelector('.cart-items');
  const cartSummary = document.querySelector('.cart-summary');

  if (!cartItemsContainer) return; // Prevent errors if cart-items is missing

  function renderCart(cart) {
    cartItemsContainer.innerHTML = '';
    
    // Check if cart items exist and is not empty
    if (!cart.items || cart.items.length === 0) {
      // Display empty cart message
      cartItemsContainer.innerHTML = `
        <div class="empty-cart-message">
          <i class="fas fa-shopping-cart" style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;"></i>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <a href="/products" class="shop-btn" style="margin-top: 1rem;">
            <i class="fas fa-store"></i> Browse Products
          </a>
        </div>
      `;
      return;
    }
    
    cart.items.forEach(item => {
      const available = item.stock - item.quantity;
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';
      itemDiv.innerHTML = `
        <div class="item-image">
          <img src="${item.image_url || '/Images/product-placeholder.jpg'}" alt="${item.name}">
        </div>
        <div class="item-details">
          <h3 class="item-name">${item.name}</h3>
          <div class="item-meta">
            <span class="seller">Category: ${item.category_name}</span>
            <span class="stock">Stock: ${item.stock}</span>
            <span class="stock-available">Available: ${available >= 0 ? available : 0}</span>
          </div>
          <div class="item-actions">
            <button class="remove-btn" data-product-id="${item.product_id}"><i class="fas fa-trash"></i> Remove</button>
            <div class="quantity-controls">
              <button class="qty-btn" data-action="decrease" data-product-id="${item.product_id}" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
              <input type="number" class="qty-input" min="1" max="${item.stock}" value="${item.quantity}" data-product-id="${item.product_id}" style="width: 48px; text-align: center;">
              <button class="qty-btn" data-action="increase" data-product-id="${item.product_id}" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
            </div>
          </div>
        </div>
        <div class="item-price">
          <div class="current-price">₦${(item.price * item.quantity).toLocaleString()}</div>
          <div class="price-per-unit" style="font-size: 0.75rem; color: var(--gray);">₦${item.price.toLocaleString()} per unit</div>
        </div>
      `;
      cartItemsContainer.appendChild(itemDiv);
    });
    // Update summary for logged-in user
    if (cartSummary) {
      // Subtotal row: first .summary-row span (label), second span (value)
      const summaryRows = cartSummary.querySelectorAll('.summary-row');
      if (summaryRows.length >= 1) {
        // Subtotal
        const subtotalLabel = summaryRows[0].querySelector('span:first-child');
        const subtotalValue = summaryRows[0].querySelector('span:last-child');
        if (subtotalLabel && subtotalValue) {
          subtotalLabel.textContent = `Subtotal (${cart.items.reduce((acc, item) => acc + item.quantity, 0)} items)`;
          subtotalValue.textContent = `₦${cart.subtotal.toLocaleString()}`;
        }
      }
      if (summaryRows.length >= 2) {
        // Delivery Fee
        const deliveryValue = summaryRows[1].querySelector('span:last-child');
        if (deliveryValue) {
          deliveryValue.textContent = cart.deliveryFee === 0 ? 'FREE' : `₦${cart.deliveryFee.toLocaleString()}`;
        }
      }
      // Total: always the last .summary-row
      if (summaryRows.length >= 3) {
        const totalRow = summaryRows[summaryRows.length - 1];
        const totalValue = totalRow.querySelector('span:last-child');
        if (totalValue) {
          totalValue.textContent = `₦${cart.total.toLocaleString()}`;
        }
      }
    }
  }

  async function fetchCart() {
    try {
      const res = await fetch('/api/cart', { credentials: 'same-origin' });
      const data = await res.json();
      if (data.success) {
        renderCart(data.data);
      } else {
        console.error('Failed to fetch cart:', data.error);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  }

  cartItemsContainer.addEventListener('click', async function(e) {
    const target = e.target;
    if (target.classList.contains('remove-btn')) {
      const productId = target.getAttribute('data-product-id');
      await fetch(`/api/cart/${productId}`, { method: 'DELETE', credentials: 'same-origin' });
      fetchCart();
    } else if (target.classList.contains('qty-btn')) {
      const productId = target.getAttribute('data-product-id');
      const input = cartItemsContainer.querySelector(`input.qty-input[data-product-id="${productId}"]`);
      let newQty = parseInt(input.value, 10);
      if (target.getAttribute('data-action') === 'increase') newQty++;
      else if (target.getAttribute('data-action') === 'decrease') newQty--;
      if (newQty > 0) {
        await fetch(`/api/cart/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ quantity: newQty })
        });
        fetchCart();
      }
    }
  });

  cartItemsContainer.addEventListener('change', async function(e) {
    if (e.target.classList.contains('qty-input')) {
      const productId = e.target.getAttribute('data-product-id');
      let newQty = parseInt(e.target.value, 10);
      if (newQty > 0) {
        await fetch(`/api/cart/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ quantity: newQty })
        });
        fetchCart();
      }
    }
  });

  // Clear cart function - returns a promise for better handling in the modal
  window.clearCart = async function() {
    return new Promise(async (resolve, reject) => {
    try {
      // Get CSRF token if available
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
      const headers = {};
      
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: headers
      });
      
      if (response.ok) {
        // Show success notification
        if (window.showCartNotification) {
          window.showCartNotification('Cart cleared successfully', 'success');
        }
        // Refresh cart display
        fetchCart();
        // Update cart count in header
        if (window.updateLoggedInCartCount) {
          window.updateLoggedInCartCount();
        }
      } else {
        // Try to get error details
        let errorMessage = 'Failed to clear cart';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        
        console.error('Failed to clear cart:', errorMessage);
        if (window.showCartNotification) {
          window.showCartNotification(errorMessage, 'error');
        }
      }
        resolve(); // Resolve the promise on success
      } catch (error) {
        console.error('Error clearing cart:', error);
        if (window.showCartNotification) {
          window.showCartNotification('Error clearing cart', 'error');
        }
        reject(error); // Reject the promise on error
      }
    });
  }
  };

  fetchCart();
});
