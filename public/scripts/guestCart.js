// public/scripts/guestCart.js
// This script handles guest user interactions with the cart, primarily by updating localStorage
// and dispatching an event to notify other components (like the header) of changes.

// Function to add an item to the guest cart
function addToGuestCart(productId, name, price, image, stock, quantity = 1) {
    let guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
    const existingItem = guestCart.items.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        guestCart.items.push({ id: productId, name, price, image, stock, quantity });
    }

    localStorage.setItem('guestCart', JSON.stringify(guestCart));
    
    // Notify other parts of the application that the cart has been updated
    window.dispatchEvent(new CustomEvent('cartUpdated'));
}

// Function to remove an item from the guest cart
window.removeGuestCartItem = function(productId) {
    let guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
    guestCart.items = guestCart.items.filter(item => item.id !== productId);
    localStorage.setItem('guestCart', JSON.stringify(guestCart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
};

// Function to update the quantity of an item in the guest cart
window.updateGuestCartQty = function(productId, qty) {
    qty = parseInt(qty, 10);
    if (isNaN(qty) || qty < 1) return;

    let guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
    const item = guestCart.items.find(item => item.id === productId);

    if (item && qty <= item.stock) {
        item.quantity = qty;
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    }
};

// Function to clear the entire guest cart
window.clearGuestCart = function() {
    localStorage.removeItem('guestCart');
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    
    // Optionally, show a notification
    if (window.showCartNotification) {
        window.showCartNotification('Cart cleared successfully', 'success');
    }
};

// Expose addToGuestCart to be used by other scripts (e.g., from a product page)
window.addToGuestCart = addToGuestCart;

