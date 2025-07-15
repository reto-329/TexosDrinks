// Functions for cart operations that work with both approaches

// Function to update quantity
async function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        newQuantity = 1;
    }
    
    try {
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity: newQuantity })
        });
        
        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to update quantity');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while updating the quantity');
    }
}

// Function to remove item from cart
async function removeFromCart(productId) {
    try {
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to remove item');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while removing the item');
    }
}

// Function to clear cart
async function clearCart() {
    try {
        const response = await fetch('/api/cart', {
            method: 'DELETE'
        });
        if (response.ok) {
            window.location.reload();
        } else {
            window.location.reload();
        }
        return true;
    } catch (error) {
        console.error('Error clearing cart:', error);
        window.location.reload();
        return false;
    }
}