// These values will be loaded dynamically from the server
// Using window to make them globally accessible to other scripts
window.FREE_DELIVERY_THRESHOLD;
window.DELIVERY_FEE;

// Function to fetch delivery settings from the server
async function loadDeliverySettings() {
    try {
        const response = await fetch('/api/settings/delivery');
        if (response.ok) {
            const settings = await response.json();
            window.FREE_DELIVERY_THRESHOLD = parseFloat(settings.FREE_DELIVERY_THRESHOLD);
            window.DELIVERY_FEE = parseFloat(settings.DELIVERY_FEE);
            console.log('Delivery settings loaded:', { 
                FREE_DELIVERY_THRESHOLD: window.FREE_DELIVERY_THRESHOLD, 
                DELIVERY_FEE: window.DELIVERY_FEE,
                rawSettings: settings
            });
            return settings;
        }
    } catch (error) {
        console.error('Error loading delivery settings:', error);
    }
    return null;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // First load delivery settings
    await loadDeliverySettings();
    
    // Then initialize cart if user is guest
    if (document.getElementById('guestCartCount')) {
        initializeGuestCart();
    }
});

// Guest Cart Functions
function initializeGuestCart() {
    // Create guest cart if it doesn't exist
    if (!localStorage.getItem('guestCart')) {
        localStorage.setItem('guestCart', JSON.stringify({
            items: [],
            lastUpdated: new Date().toISOString()
        }));
    }
    
    updateGuestCartDisplay();
}

function updateGuestCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
    const cartContainer = document.getElementById('local-cart');
    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    
    // Update cart count
    if (document.getElementById('guestCartCount')) {
        document.getElementById('guestCartCount').textContent = itemCount;
    }
    
    // Handle empty cart
    if (itemCount === 0) {
        if (cartContainer) {
            cartContainer.innerHTML = `
                <div class="empty-cart-message" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: var(--gray); opacity: 0.5;"></i>
                    <p style="margin-top: 1rem; color: var(--gray);">Your cart is empty</p>
                </div>
            `;
        }
        updateGuestCartTotals(0);
        return;
    }
    
    // Calculate subtotal and render items
    let subtotal = 0;
    let html = '';
    
    cart.items.forEach(item => {
        subtotal += item.price * item.quantity;
        html += `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="item-image">
                    <img src="${item.image || '/Images/product-placeholder.jpg'}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h3 class="item-name">${item.name}</h3>
                    <div class="item-meta">
                        <span class="seller">Category: ${item.category || 'Beverage'}</span>
                        <span class="stock-info">Stock: ${item.stock || 0} available</span>
                        ${item.description ? `<p class="item-description" style="font-size: 0.875rem; color: var(--gray); margin-top: 0.25rem;">
                            ${item.description.substring(0, 50)}...
                        </p>` : ''}
                    </div>
                    ${item.stock < 5 ? `<div class="stock-warning">
                        <i class="fas fa-exclamation-circle"></i> Only ${item.stock} left in stock
                    </div>` : ''}
                    <div class="item-actions">
                        <button class="remove-btn" onclick="removeFromGuestCart('${item.id}')">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="updateGuestQuantity('${item.id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                            <span class="qty-display">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateGuestQuantity('${item.id}', ${item.quantity + 1})" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
                        </div>
                    </div>
                </div>
                <div class="item-price">
                    <div class="current-price">₦${(item.price * item.quantity).toLocaleString()}</div>
                    <div class="price-per-unit" style="font-size: 0.75rem; color: var(--gray);">
                        ₦${item.price.toLocaleString()} per unit
                    </div>
                </div>
            </div>
        `;
    });
    
    if (cartContainer) {
        cartContainer.innerHTML = html;
    }
    
    updateGuestCartTotals(subtotal);
}

function updateGuestCartTotals(subtotal) {
    // If settings haven't been loaded yet, use reasonable defaults
    const threshold = window.FREE_DELIVERY_THRESHOLD || 100000;
    // Make sure we're using the actual delivery fee from the database
    const fee = window.DELIVERY_FEE;
    
    const deliveryFee = subtotal >= threshold ? 0 : fee;
    const total = subtotal + deliveryFee;
    const progress = Math.min(subtotal / threshold, 1);
    
    // Update UI elements if they exist
    if (document.getElementById('guestSubtotal')) {
        document.getElementById('guestSubtotal').textContent = `₦${subtotal.toLocaleString()}`;
    }
    if (document.getElementById('guestDeliveryFee')) {
        // Only show FREE if subtotal is above threshold, otherwise show the actual fee
        if (subtotal >= threshold) {
            document.getElementById('guestDeliveryFee').textContent = 'FREE';
        } else {
            document.getElementById('guestDeliveryFee').textContent = `₦${fee.toLocaleString()}`;
        }
    }
    if (document.getElementById('guestTotal')) {
        document.getElementById('guestTotal').textContent = `₦${total.toLocaleString()}`;
    }
    
    // Update delivery progress
    const progressElement = document.getElementById('guestProgressFill');
    const messageElement = document.getElementById('guestDeliveryMessage');
    const containerElement = document.getElementById('guestDeliveryProgress');
    
    if (progressElement && messageElement && containerElement) {
        if (progress < 1) {
            progressElement.style.width = `${progress * 100}%`;
            messageElement.textContent = `Spend ₦${(threshold - subtotal).toLocaleString()} more for FREE delivery`;
            containerElement.style.display = 'block';
        } else {
            containerElement.style.display = 'none';
        }
    }
}

function removeFromGuestCart(productId) {
    let cart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
    cart.items = cart.items.filter(item => item.id !== productId);
    cart.lastUpdated = new Date().toISOString();
    localStorage.setItem('guestCart', JSON.stringify(cart));
    updateGuestCartDisplay();
}

function updateGuestQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromGuestCart(productId);
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
    const item = cart.items.find(item => item.id === productId);
    
    if (item) {
        // Check stock limit
        if (newQuantity > item.stock) {
            showToast(`Only ${item.stock} items available in stock`, 'error');
            return;
        }
        
        item.quantity = newQuantity;
        cart.lastUpdated = new Date().toISOString();
        localStorage.setItem('guestCart', JSON.stringify(cart));
        updateGuestCartDisplay();
    }
}

// Server Cart Functions (for logged-in users)
async function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    try {
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify({ quantity: newQuantity })
        });
        
        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.json();
            showToast(error.error || 'Failed to update quantity', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred while updating the quantity', 'error');
    }
}

async function removeFromCart(productId) {
    try {
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
            }
        });
        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.json();
            showToast(error.error || 'Failed to remove item', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred while removing the item', 'error');
    }
}

async function clearCart() {
    // Only call confirm if not using modal
    try {
        const response = await fetch('/api/cart', {
            method: 'DELETE',
            headers: {
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
            }
        });
        if (response.ok) {
            window.location.reload();
        } else {
            // Don't show alert, just reload to reflect empty cart
            window.location.reload();
        }
    } catch (error) {
        // On error, just reload to reflect any changes
        window.location.reload();
    }
}i/cart', {
            method: 'DELETE',
            headers: {
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
            }
        });
        if (response.ok) {
            window.location.reload();
        } else {
            // Don't show alert, just reload to reflect empty cart
            window.location.reload();
        }
    } catch (error) {
        // On error, just reload to reflect any changes
        window.location.reload();
    }
}

// Add modal HTML to the page if not present
function ensureClearCartModal() {
    if (document.getElementById('clearCartModal')) return;
    const modal = document.createElement('div');
    modal.id = 'clearCartModal';
    modal.innerHTML = `
      <div class="modal-backdrop" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9998;display:flex;align-items:center;justify-content:center;">
        <div class="modal-content" style="background:#fff;padding:2rem 2.5rem;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,0.18);max-width:90vw;min-width:300px;z-index:9999;text-align:center;">
          <h2 style="margin-bottom:1rem;">Clear Cart</h2>
          <p style="margin-bottom:2rem;">Are you sure you want to clear your entire cart?</p>
          <button id="clearCartYes" style="background:#e53e3e;color:#fff;padding:0.5rem 1.5rem;border:none;border-radius:5px;margin-right:1rem;cursor:pointer;">Yes</button>
          <button id="clearCartNo" style="background:#eee;color:#333;padding:0.5rem 1.5rem;border:none;border-radius:5px;cursor:pointer;">No</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('clearCartYes').onclick = function() {
        clearGuestCart();
        closeClearCartModal();
    };
    document.getElementById('clearCartNo').onclick = closeClearCartModal;
    modal.onclick = function(e) {
        if (e.target === modal) closeClearCartModal();
    };
}

function closeClearCartModal() {
    const modal = document.getElementById('clearCartModal');
    if (modal) {
        modal.parentNode.removeChild(modal);
    }
}

// Add this function for guest cart clearing
function clearGuestCart() {
    localStorage.setItem('guestCart', JSON.stringify({ items: [], lastUpdated: new Date().toISOString() }));
    updateGuestCartDisplay();
}
// Add modal HTML to the page if not present
function ensureClearCartModal() {
    if (document.getElementById('clearCartModal')) return;
    const modal = document.createElement('div');
    modal.id = 'clearCartModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Clear Cart</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to remove all items from your cart?</p>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelClearCart">Cancel</button>
                <button class="btn-danger" id="confirmClearCart">Clear Cart</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add event listeners
    document.querySelector('#clearCartModal .close').addEventListener('click', () => {
        document.getElementById('clearCartModal').style.display = 'none';
    });
    document.getElementById('cancelClearCart').addEventListener('click', () => {
        document.getElementById('clearCartModal').style.display = 'none';
    });
    document.getElementById('confirmClearCart').addEventListener('click', () => {
        document.getElementById('clearCartModal').style.display = 'none';
        clearCart();
    });
}