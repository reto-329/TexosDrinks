// public/scripts/loggedInCart.js
// Handles cart rendering and actions for logged-in users

document.addEventListener('DOMContentLoaded', function() {
  const userMeta = document.querySelector('meta[name="user-logged-in"]');
  const isLoggedIn = userMeta && userMeta.content === 'true';
  if (!isLoggedIn) return;

  const cartItemsContainer = document.querySelector('.cart-items');
  if (!cartItemsContainer) return;

  async function fetchCartAndRender() {
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

  function renderCart(cart) {
    cartItemsContainer.innerHTML = '';
    if (!cart.items || cart.items.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart-message">
          <i class="fas fa-shopping-cart"></i>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything yet.</p>
          <a href="/products" class="shop-btn">Browse Products</a>
        </div>
      `;
      return;
    }

    cart.items.forEach(item => {
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
          </div>
          <div class="item-actions">
            <button class="remove-btn" data-product-id="${item.product_id}"><i class="fas fa-trash"></i> Remove</button>
            <div class="quantity-controls">
              <button class="qty-btn" data-action="decrease" data-product-id="${item.product_id}" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
              <span class="qty-display">${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-product-id="${item.product_id}" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
            </div>
          </div>
        </div>
        <div class="item-price">
          <div class="current-price">₦${(item.price * item.quantity).toLocaleString()}</div>
        </div>
      `;
      cartItemsContainer.appendChild(itemDiv);
    });
  }

  cartItemsContainer.addEventListener('click', async function(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const productId = target.dataset.productId;
    if (!productId) return;

    if (target.classList.contains('remove-btn')) {
      await fetch(`/api/cart/${productId}`, { method: 'DELETE', credentials: 'same-origin' });
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      fetchCartAndRender();
    } else if (target.classList.contains('qty-btn')) {
      const action = target.dataset.action;
      const qtySpan = target.parentElement.querySelector('.qty-display');
      let newQty = parseInt(qtySpan.textContent, 10);

      if (action === 'increase') newQty++;
      else if (action === 'decrease') newQty--;

      if (newQty > 0) {
        await fetch(`/api/cart/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ quantity: newQty })
        });
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        fetchCartAndRender();
      }
    }
  });

  window.clearCart = async function() {
    await fetch('/api/cart', { method: 'DELETE', credentials: 'same-origin' });
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    fetchCartAndRender();
  };

  fetchCartAndRender();
});

