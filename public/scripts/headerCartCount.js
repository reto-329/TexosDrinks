// public/scripts/headerCartCount.js

// Function to update the cart count display in the header
function updateHeaderCartCount(count) {
    const cartCountElements = document.querySelectorAll('.cart-count, #cartCount');
    cartCountElements.forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
        if (count > 0) {
            el.classList.add('bounce');
            setTimeout(() => el.classList.remove('bounce'), 500);
        }
    });
}

// Function for logged-in users to fetch cart count from the API
async function fetchUserCartCount() {
    try {
        const response = await fetch('/api/cart/count', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            updateHeaderCartCount(data.count || 0);
            return data.count || 0;
        }
    } catch (error) {
        console.error('Error fetching cart count:', error);
    }
    return 0;
}

// Function for guest users to get cart count from local storage
function getGuestCartCount() {
    const guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
    return guestCart.items.reduce((total, item) => total + item.quantity, 0);
}

// Main function to run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const userMeta = document.querySelector('meta[name="user-logged-in"]');
    const isLoggedIn = userMeta && userMeta.content === 'true';

    if (isLoggedIn) {
        fetchUserCartCount();
    } else {
        const count = getGuestCartCount();
        updateHeaderCartCount(count);
    }
});

// Expose global functions to allow other scripts to trigger updates
window.updateCartCount = () => {
    const userMeta = document.querySelector('meta[name="user-logged-in"]');
    const isLoggedIn = userMeta && userMeta.content === 'true';
    if (isLoggedIn) {
        return fetchUserCartCount();
    } else {
        const count = getGuestCartCount();
        updateHeaderCartCount(count);
        return Promise.resolve(count);
    }
};

window.updateHeaderCartCount = updateHeaderCartCount;
