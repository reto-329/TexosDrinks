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
});

async function addToCart(productId, quantity, button) {
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    button.disabled = true;

    try {
        const userMeta = document.querySelector('meta[name="user-logged-in"]');
        const isLoggedIn = userMeta && userMeta.content === 'true';

        if (isLoggedIn) {
            await addToCartAPI(productId, quantity);
        } else {
            addToCartGuest(productId, quantity);
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
    const headers = {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
    };

    const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
            product_id: productId,
            quantity: quantity
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to cart');
    }

    window.dispatchEvent(new CustomEvent('cartUpdated'));
}

function addToCartGuest(productId, quantity) {
    const guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
    const existingItem = guestCart.items.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        guestCart.items.push({
            id: productId,
            name: productCard.dataset.productName || `Product ${productId}`,
            price: parseFloat(productCard.dataset.productPrice) || 0,
            image: productCard.dataset.productImage || '/Images/logo1.png',
            quantity: quantity,
            stock: parseInt(productCard.dataset.productStock) || 0
        });
    }

    localStorage.setItem('guestCart', JSON.stringify(guestCart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
}
