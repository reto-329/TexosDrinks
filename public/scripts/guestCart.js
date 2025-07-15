// public/scripts/guestCart.js
// Render guest cart items if user is not logged in
if (document.querySelector('meta[name="user-logged-in"]').content === 'false') {
    function renderGuestCart() {
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
        const cartContainer = document.getElementById('local-cart');
        const cartCount = document.getElementById('guestCartCount');
        const subtotalEl = document.getElementById('guestSubtotal');
        const deliveryFeeEl = document.getElementById('guestDeliveryFee');
        const totalEl = document.getElementById('guestTotal');
        const progressFill = document.getElementById('guestProgressFill');
        const deliveryMsg = document.getElementById('guestDeliveryMessage');
        const deliveryProgress = document.getElementById('guestDeliveryProgress');
        
        let subtotal = 0;
        let totalItems = 0;
        let deliveryFee = 0;
        // Use the dynamic values from cart.js
        const FREE_DELIVERY_THRESHOLD = window.FREE_DELIVERY_THRESHOLD || 100000;
        // Make sure we're getting the actual delivery fee from the database
        const DELIVERY_FEE = window.DELIVERY_FEE;
        console.log('Guest cart using delivery settings:', { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE });
        
        cartContainer.innerHTML = '';
        guestCart.items.forEach(item => {
            subtotal += item.price * item.quantity;
            totalItems += item.quantity;
            const available = item.stock - item.quantity;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h3 class="item-name">${item.name}</h3>
                    <div class="item-meta">
                        <span class="seller">Stock: ${item.stock}</span>
                        <span class="stock-available">Available: ${available >= 0 ? available : 0}</span>
                    </div>
                    <div class="item-actions">
                        <button class="remove-btn" onclick="removeGuestCartItem('${item.id}')">
                            <i class='fas fa-trash'></i> Remove
                        </button>
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="updateGuestCartQty('${item.id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''} aria-label="Decrease quantity">-</button>
                            <input type="number" class="qty-input" min="1" max="${item.stock}" value="${item.quantity}" onchange="updateGuestCartQty('${item.id}', this.value)" style="width: 48px; text-align: center;" aria-label="Quantity">
                            <button class="qty-btn" onclick="updateGuestCartQty('${item.id}', ${item.quantity + 1})" ${item.quantity >= item.stock ? 'disabled' : ''} aria-label="Increase quantity">+</button>
                        </div>
                    </div>
                </div>
                <div class="item-price">
                    <div class="current-price">₦${(item.price * item.quantity).toLocaleString()}</div>
                    <div class="price-per-unit" style="font-size: 0.75rem; color: var(--gray);">₦${item.price.toLocaleString()} per unit</div>
                </div>
            `;
            cartContainer.appendChild(itemDiv);
        });
        cartCount.textContent = totalItems;
        subtotalEl.textContent = `₦${subtotal.toLocaleString()}`;
        // Delivery fee logic
        if (subtotal >= FREE_DELIVERY_THRESHOLD) {
            deliveryFee = 0;
            deliveryMsg.textContent = "You've qualified for FREE delivery!";
            deliveryMsg.style.color = 'var(--success)';
            progressFill.style.width = '100%';
        } else {
            deliveryFee = DELIVERY_FEE;
            deliveryMsg.textContent = `Spend ₦${(FREE_DELIVERY_THRESHOLD - subtotal).toLocaleString()} more for FREE delivery`;
            deliveryMsg.style.color = '';
            progressFill.style.width = `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`;
        }
        // Only show FREE if subtotal is above threshold, otherwise show the fee
        if (subtotal >= FREE_DELIVERY_THRESHOLD) {
            deliveryFeeEl.textContent = 'FREE';
        } else {
            // Make sure we're displaying the actual fee from the database
            deliveryFeeEl.textContent = `₦${DELIVERY_FEE.toLocaleString()}`;
        }
        totalEl.textContent = `₦${(subtotal + deliveryFee).toLocaleString()}`;
        deliveryProgress.style.display = 'block';
    }
    // Remove item
    window.removeGuestCartItem = function(id) {
        let guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
        guestCart.items = guestCart.items.filter(item => item.id !== id);
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        renderGuestCart();
        updateCartCount(guestCart.items.reduce((total, item) => total + item.quantity, 0));
    };
    // Update quantity
    window.updateGuestCartQty = function(id, qty) {
        qty = parseInt(qty, 10);
        if (isNaN(qty) || qty < 1) return;
        let guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
        const item = guestCart.items.find(item => item.id === id);
        if (item && qty <= item.stock) {
            item.quantity = qty;
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            renderGuestCart();
            updateCartCount(guestCart.items.reduce((total, item) => total + item.quantity, 0));
        }
    };
    // Clear guest cart - returns a promise for consistent behavior with logged-in version
    window.clearCart = function() {
        return new Promise((resolve) => {
            // Show confirmation modal first (handled in cart.ejs)
            localStorage.removeItem('guestCart');
            renderGuestCart();
            updateCartCount(0);
            
            // Show notification if available
            if (window.showCartNotification) {
                window.showCartNotification('Cart cleared successfully', 'success');
            }
            
            // Always resolve since local storage operations don't fail
            resolve();
        });
    };
    
    // Initial render
    renderGuestCart();
}
