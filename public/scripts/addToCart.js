document.addEventListener('DOMContentLoaded', function() {
    // Use event delegation on the body to handle all "Add to Cart" clicks
    document.body.addEventListener('click', function(e) {
        const button = e.target.closest('.add-to-cart-btn');
        if (button) {
            e.preventDefault();
            const productCard = button.closest('.product-card, .product-list-item, .product-details-container');
            const productId = productCard ? productCard.dataset.productId : null;
            
            if (productId) {
                let quantity = 1;
                // For product details page, get the quantity from the input
                if (productCard.classList.contains('product-details-container')) {
                    const qtyInput = document.getElementById('qtyInput');
                    if (qtyInput) {
                        quantity = parseInt(qtyInput.value, 10) || 1;
                    }
                }
                addToCart(productId, quantity, button);
            }
        }
    });

    // Update cart count for guest users on page load
    if (!document.querySelector('meta[name="user-logged-in"]')) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
        updateCartCount(guestCart.items.reduce((total, item) => total + item.quantity, 0));
    }
});

async function addToCart(productId, quantity, button) {
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    button.disabled = true;

    try {
        const userMeta = document.querySelector('meta[name="user-logged-in"]');
        const isLoggedIn = userMeta && userMeta.content === 'true';

        if (isLoggedIn) {
            const result = await addToCartAPI(productId, quantity);
            if (result && result.cartCount !== undefined && typeof window.updateHeaderCartCount === 'function') {
                window.updateHeaderCartCount(result.cartCount);
            }
        } else {
            addToCartGuest(productId, quantity);
        }
        
        // Fallback update for both logged-in and guest users
        if (typeof window.updateCartCount === 'function') {
            window.updateCartCount();
        }

        if (typeof window.showCartNotification === 'function') {
            window.showCartNotification('Item added to cart successfully!', 'success');
        }

    } catch (error) {
        console.error('Add to cart error:', error);
        if (typeof window.showCartNotification === 'function') {
            window.showCartNotification(error.message || 'Failed to add to cart', 'error');
        }
    } finally {
        // Restore button state
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
        }, 1000); // Delay to show success state
    }
}

async function addToCartAPI(productId, quantity) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (!csrfToken) {
        console.warn('CSRF token is missing. If your backend requires it, this request may fail.');
    }
    // Try to get JWT from localStorage (if your app uses JWT)
    const jwt = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
    };
    if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
    }
    let response;
    try {
        response = await fetch('/api/cart', {
            method: 'POST',
            headers,
            credentials: 'include', // Use 'include' for cross-origin/session compatibility
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });
    } catch (networkError) {
        console.error('Network error while adding to cart:', networkError);
        throw new Error('Network error. Please check your connection.');
    }

    if (!response.ok) {
        let errorMsg = 'Failed to add to cart';
        try {
            const error = await response.json();
            errorMsg = error.error || error.message || errorMsg;
            console.error('API error response:', error);
        } catch (parseError) {
            console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    if (data.cartCount !== undefined && typeof window.updateHeaderCartCount === 'function') {
        window.updateHeaderCartCount(data.cartCount);
    }
    return data;
}

function addToCartGuest(productId, quantity) {
    const guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
    const existingItem = guestCart.items.find(item => item.id === productId);
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    const availableStock = parseInt(productCard.dataset.productStock) || 0;

    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        
        if (newQuantity > availableStock) {
            if (availableStock === 0) {
                throw new Error('This product is out of stock');
            } else if (existingItem.quantity >= availableStock) {
                throw new Error('This product is out of stock');
            } else {
                const remaining = availableStock - existingItem.quantity;
                throw new Error(`Only ${remaining} more item(s) can be added to cart`);
            }
        }
        
        existingItem.quantity = newQuantity;
    } else {
        if (availableStock < quantity) {
            if (availableStock === 0) {
                throw new Error('This product is out of stock');
            } else {
                throw new Error(`Only ${availableStock} items available in stock`);
            }
        }
        
        guestCart.items.push({
            id: productId,
            name: productCard.dataset.productName || `Product ${productId}`,
            price: parseFloat(productCard.dataset.productPrice) || 0,
            image: productCard.dataset.productImage || '/Images/logo1.png',
            quantity: quantity,
            stock: availableStock
        });
    }

    localStorage.setItem('guestCart', JSON.stringify(guestCart));
    const totalCount = guestCart.items.reduce((total, item) => total + item.quantity, 0);
    if (typeof window.updateHeaderCartCount === 'function') {
        window.updateHeaderCartCount(totalCount);
    }
}

