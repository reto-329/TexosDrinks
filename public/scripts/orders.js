// Global variables for pagination
let currentPage = 1;
let totalPages = 1;
let ordersPerPage = 5;

// Function to load orders with pagination
async function loadUserOrders(page = 1) {
    try {
        // Show loading indicator
        const ordersContainer = document.querySelector('.orders-list');
        if (ordersContainer) {
            ordersContainer.innerHTML = '<div class="loading">Loading orders...</div>';
        }
        
        // Fetch orders with pagination
        const response = await fetch(`/api/orders?page=${page}&limit=${ordersPerPage}`);
        const data = await response.json();
        
        // Update pagination variables
        currentPage = data.pagination.page;
        totalPages = data.pagination.totalPages;
        ordersPerPage = data.pagination.limit;
        
        // Render orders
        renderUserOrders(data.orders);
        
        // Render pagination controls
        renderPagination();
    } catch (error) {
        console.error('Error loading orders:', error);
        const ordersContainer = document.querySelector('.orders-list');
        if (ordersContainer) {
            ordersContainer.innerHTML = '<div class="error">Failed to load orders. Please try again.</div>';
        }
    }
}

// Function to render orders
function renderUserOrders(orders) {
    const ordersContainer = document.querySelector('.orders-list');
    if (!ordersContainer) return;
    
    // Clear container
    ordersContainer.innerHTML = '';
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-orders">
                <div class="empty-icon">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <h3 class="empty-title">No orders yet</h3>
                <p class="empty-text">You haven't placed any orders yet. Start shopping to see your orders here.</p>
                <a href="/products" class="shop-btn">
                    <i class="fas fa-store"></i> Browse Products
                </a>
            </div>
        `;
        return;
    }
    
    // Create order cards
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        // Format date
        const orderDate = new Date(order.created_at);
        const formattedDate = orderDate.toLocaleDateString() + ' ' + 
                             orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Create order header
        const orderHeader = document.createElement('div');
        orderHeader.className = 'order-header';
        orderHeader.innerHTML = `
            <div class="order-id">Order #${order.id}</div>
            <div class="order-date">${formattedDate}</div>
            <div class="order-status status-${order.status_name}">
                ${order.status_name.charAt(0).toUpperCase() + order.status_name.slice(1)}
            </div>
        `;
        
        // Create order body
        const orderBody = document.createElement('div');
        orderBody.className = 'order-body';
        orderBody.style.display = 'none'; // Initially hidden
        
        // Create order items section
        const orderItems = document.createElement('div');
        orderItems.className = 'order-items';
        
        // Add items to the order
        order.items.forEach(item => {
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            orderItem.innerHTML = `
                <div class="item-image">
                    <img src="${item.image_url || '/Images/product-placeholder.jpg'}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-meta">
                        Quantity: ${item.quantity} | Category: ${item.category_name}
                    </div>
                </div>
                <div class="item-price">
                    ₦${(item.price * item.quantity).toLocaleString()}
                </div>
            `;
            orderItems.appendChild(orderItem);
        });
        
        // Create order summary
        const orderSummary = document.createElement('div');
        orderSummary.className = 'order-summary';
        orderSummary.innerHTML = `
            <div class="summary-row">
                <span>Subtotal</span>
                <span>₦${order.total_amount.toLocaleString()}</span>
            </div>
            <div class="summary-row">
                <span>Delivery Fee</span>
                <span>₦0</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>₦${order.total_amount.toLocaleString()}</span>
            </div>
        `;
        
        // Create order actions
        const orderActions = document.createElement('div');
        orderActions.className = 'order-actions';
        orderActions.innerHTML = `
            <a href="/orders/${order.id}" class="order-btn primary-btn">
                <i class="fas fa-eye"></i> View Details
            </a>
            ${order.status_name === 'pending' ? `
                <a href="/checkout?order_id=${order.id}" class="order-btn secondary-btn">
                    <i class="fas fa-credit-card"></i> Pay Now
                </a>
            ` : ''}
        `;
        
        // Add dropdown indicator
        const indicator = document.createElement('i');
        indicator.className = 'fas fa-chevron-down';
        indicator.style.marginLeft = '8px';
        orderHeader.appendChild(indicator);
        
        // Make the header clickable
        orderHeader.style.cursor = 'pointer';
        
        // Add click event
        orderHeader.addEventListener('click', function() {
            // Toggle visibility
            if (orderBody.style.display === 'none') {
                orderBody.style.display = 'block';
                indicator.className = 'fas fa-chevron-up';
            } else {
                orderBody.style.display = 'none';
                indicator.className = 'fas fa-chevron-down';
            }
        });
        
        // Assemble order body
        orderBody.appendChild(orderItems);
        orderBody.appendChild(orderSummary);
        orderBody.appendChild(orderActions);
        
        // Assemble order card
        orderCard.appendChild(orderHeader);
        orderCard.appendChild(orderBody);
        
        // Add to container
        ordersContainer.appendChild(orderCard);
    });
}

// Function to render pagination controls
function renderPagination() {
    // Create pagination container if it doesn't exist
    let paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        const ordersContainer = document.querySelector('.orders-list');
        if (ordersContainer && ordersContainer.parentNode) {
            ordersContainer.parentNode.insertBefore(paginationContainer, ordersContainer.nextSibling);
        }
    }
    
    // Clear container
    paginationContainer.innerHTML = '';
    
    // Don't show pagination if there's only one page
    if (totalPages <= 1) return;
    
    // Create pagination controls
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-btn prev';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            loadUserOrders(currentPage - 1);
        }
    });
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn next';
    nextButton.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadUserOrders(currentPage + 1);
        }
    });
    
    // Page info
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Assemble pagination
    pagination.appendChild(prevButton);
    pagination.appendChild(pageInfo);
    pagination.appendChild(nextButton);
    
    // Add to container
    paginationContainer.appendChild(pagination);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the orders page
    const ordersContainer = document.querySelector('.orders-list');
    if (ordersContainer) {
        // Load orders with pagination
        loadUserOrders();
    } else {
        // If we're on a single order page, handle toggle functionality
        const orderCards = document.querySelectorAll('.order-card');
        
        // Add click event to each order header
        orderCards.forEach(card => {
            const header = card.querySelector('.order-header');
            const body = card.querySelector('.order-body');
            
            if (header && body) {
                // Initially hide the order items
                body.style.display = 'none';
                
                // Add dropdown indicator
                const indicator = document.createElement('i');
                indicator.className = 'fas fa-chevron-down';
                indicator.style.marginLeft = '8px';
                header.appendChild(indicator);
                
                // Make the header clickable
                header.style.cursor = 'pointer';
                
                // Add click event
                header.addEventListener('click', function() {
                    // Toggle visibility
                    if (body.style.display === 'none') {
                        body.style.display = 'block';
                        indicator.className = 'fas fa-chevron-up';
                    } else {
                        body.style.display = 'none';
                        indicator.className = 'fas fa-chevron-down';
                    }
                });
            }
        });
    }
});