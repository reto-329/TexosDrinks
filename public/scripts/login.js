// Function to clear error messages
function clearLoginErrors() {
    const errorAlert = document.getElementById('errorAlert');
    errorAlert.style.display = 'none';
}

// Function to handle forgot password
function handleForgotPassword() {
    window.location.href = '/forgot-password';
}

// Add input event listeners to clear errors when user starts typing
document.getElementById('email').addEventListener('input', clearLoginErrors);
document.getElementById('password').addEventListener('input', clearLoginErrors);

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');
    const originalBtnText = submitBtn.textContent;
    const errorAlert = document.getElementById('errorAlert');
    
    // Clear previous errors
    errorAlert.style.display = 'none';
    
    // Set loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    try {
        // First, check if there's a guest cart to merge later
        const guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
        const hasGuestItems = guestCart.items && guestCart.items.length > 0;
        
        // Login the user
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');
        
        // If there are guest cart items, merge them before redirecting
        if (hasGuestItems) {
            try {
                // Format the items for the API - ensure we're using product_id as the API expects
                const formattedItems = guestCart.items.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity
                }));
                
                // Call the merge API
                const mergeResponse = await fetch('/api/cart/merge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ items: formattedItems })
                });
                
                if (mergeResponse.ok) {
                    // Clear the guest cart from localStorage
                    localStorage.removeItem('guestCart');
                    
                    // Show success notification and redirect
                    const notification = document.createElement('div');
                    notification.className = 'notification notification-success show';
                    notification.innerHTML = '<i class="fas fa-check-circle"></i><span>Your cart items have been saved to your account!</span>';
                    document.body.appendChild(notification);
                    
                    // Redirect after a short delay to show the notification
                    setTimeout(() => {
                        window.location.href = '/cart';
                    }, 1500);
                    return;
                }
            } catch (mergeErr) {
                console.warn('Could not merge guest cart:', mergeErr);
            }
        }
        
        // If no guest cart or merge failed, show success notification and redirect to dashboard
        const successNotification = document.createElement('div');
        successNotification.className = 'notification notification-success show';
        successNotification.innerHTML = '<i class="fas fa-check-circle"></i><span>Login successful! Redirecting...</span>';
        document.body.appendChild(successNotification);
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1000);
    } catch (error) {
        console.error('Login error:', error);
        
        // Show error in the alert div
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = error.message || 'Login failed. Please try again.';
        errorAlert.style.display = 'flex';
        
        // Add shake animation to the form
        const form = document.getElementById('loginForm');
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
        
        // Also show a notification for better visibility
        const notification = document.createElement('div');
        notification.className = 'notification notification-error show';
        notification.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${error.message || 'Login failed. Please try again.'}</span>`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Focus on the email field
        document.getElementById('email').focus();
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});
