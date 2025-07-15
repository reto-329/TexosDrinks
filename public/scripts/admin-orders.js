// Global variables for pagination
let currentPage = 1;
let totalPages = 1;
let ordersPerPage = 10;
let currentFilter = '';

// Function to load orders with pagination
async function loadOrders(page = 1, filter = '') {
    try {
        // Show loading indicator
        const tableBody = document.getElementById('ordersTableBody');
        const cardContainer = document.getElementById('orderCardContainer');
        
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-spinner fa-spin"></i> Loading orders...
                    </td>
                </tr>
            `;
        }
        
        if (cardContainer) {
            cardContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin"></i> Loading orders...
                </div>
            `;
        }
        
        // Fetch orders with pagination
        const response = await fetch(`/api/admin/orders?page=${page}&limit=${ordersPerPage}`);
        const data = await response.json();
        
        // Update pagination variables
        currentPage = data.pagination.page;
        totalPages = data.pagination.totalPages;
        ordersPerPage = data.pagination.limit;
        
        // Store orders in global variable for filtering
        window.allOrders = data.orders;
        
        // Render orders
        if (filter) {
            filterOrders(filter);
        } else {
            renderOrders(data.orders);
        }
        
        // Render pagination controls
        renderPagination();
    } catch (error) {
        console.error('Error loading orders:', error);
        alert('Failed to load orders. Please try again.');
    }
}

// Filter orders by status
function filterOrders(filter) {
    currentFilter = filter;
    
    if (!window.allOrders) {
        return;
    }
    
    let filteredOrders;
    
    if (filter === 'all') {
        filteredOrders = window.allOrders;
    } else {
        filteredOrders = window.allOrders.filter(order => order.status_name === filter);
    }
    
    renderOrders(filteredOrders);
}

// Render orders in table and cards
function renderOrders(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    const cardContainer = document.getElementById('orderCardContainer');
    
    if (tableBody) tableBody.innerHTML = '';
    if (cardContainer) cardContainer.innerHTML = '';
    
    if (orders.length === 0) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        No orders found
                    </td>
                </tr>
            `;
        }
        
        if (cardContainer) {
            cardContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p>No orders found</p>
                </div>
            `;
        }
        return;
    }
    
    orders.forEach(order => {
        // Format date
        const orderDate = new Date(order.created_at);
        const formattedDate = orderDate.toLocaleDateString() + ' ' + 
                             orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Create table row for desktop view
        if (tableBody) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${order.username || 'Guest'}</td>
                <td>${formattedDate}</td>
                <td>₦${parseFloat(order.total_amount).toLocaleString()}</td>
                <td>
                    <div class="order-status status-${order.status_name}">
                        ${order.status_name.charAt(0).toUpperCase() + order.status_name.slice(1)}
                    </div>
                </td>
                <td>
                    <a href="/admin/orders/${order.id}" class="action-btn view-btn">
                        <i class="fas fa-eye"></i> View
                    </a>
                    <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                        <option value="">Change Status</option>
                        <!-- Status options will be added via JavaScript -->
                    </select>
                </td>
            `;
            tableBody.appendChild(row);
            
            // Add status options to dropdown if statuses are loaded
            if (window.orderStatuses) {
                const statusSelect = row.querySelector('.status-select');
                window.orderStatuses.forEach(status => {
                    const option = document.createElement('option');
                    option.value = status.name;
                    option.textContent = status.name.charAt(0).toUpperCase() + status.name.slice(1);
                    statusSelect.appendChild(option);
                });
            }
        }
        
        // Create card for mobile view
        if (cardContainer) {
            const card = document.createElement('div');
            card.className = 'order-card';
            card.innerHTML = `
                <div class="order-card-header">
                    <div><strong>Order #${order.id}</strong></div>
                    <div class="order-status status-${order.status_name}">
                        ${order.status_name.charAt(0).toUpperCase() + order.status_name.slice(1)}
                    </div>
                </div>
                <div class="order-card-row">
                    <div class="order-card-label">Customer:</div>
                    <div>${order.username || 'Guest'}</div>
                </div>
                <div class="order-card-row">
                    <div class="order-card-label">Date:</div>
                    <div>${formattedDate}</div>
                </div>
                <div class="order-card-row">
                    <div class="order-card-label">Total:</div>
                    <div><strong>₦${parseFloat(order.total_amount).toLocaleString()}</strong></div>
                </div>
                <div class="order-card-actions">
                    <a href="/admin/orders/${order.id}" class="action-btn view-btn">
                        <i class="fas fa-eye"></i> View Details
                    </a>
                    <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                        <option value="">Change Status</option>
                        <!-- Status options will be added via JavaScript -->
                    </select>
                </div>
            `;
            cardContainer.appendChild(card);
            
            // Add status options to dropdown if statuses are loaded
            if (window.orderStatuses) {
                const statusSelect = card.querySelector('.status-select');
                window.orderStatuses.forEach(status => {
                    const option = document.createElement('option');
                    option.value = status.name;
                    option.textContent = status.name.charAt(0).toUpperCase() + status.name.slice(1);
                    statusSelect.appendChild(option);
                });
            }
        }
    });
}

// Function to render pagination controls
function renderPagination() {
    // Create pagination container if it doesn't exist
    let paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        
        // Find where to insert pagination
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
            tableContainer.parentNode.insertBefore(paginationContainer, tableContainer.nextSibling);
        } else {
            const mobileView = document.querySelector('.mobile-view');
            if (mobileView) {
                mobileView.parentNode.insertBefore(paginationContainer, mobileView.nextSibling);
            }
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
            loadOrders(currentPage - 1, currentFilter);
        }
    });
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn next';
    nextButton.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadOrders(currentPage + 1, currentFilter);
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

// Update order status
async function updateOrderStatus(orderId, status) {
    if (!status) return;
    
    try {
        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Reload orders to reflect the change
            loadOrders(currentPage, currentFilter);
        } else {
            alert('Failed to update order status: ' + data.message);
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status. Please try again.');
    }
}

// Load order statuses for dropdowns
async function loadOrderStatuses() {
    try {
        const response = await fetch('/api/admin/orders/statuses');
        const statuses = await response.json();
        
        // Store statuses in global variable
        window.orderStatuses = statuses;
    } catch (error) {
        console.error('Error loading order statuses:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load all orders
    loadOrders();
    
    // Load order statuses for dropdowns
    loadOrderStatuses();
    
    // Handle filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Filter orders
            const filter = this.dataset.filter;
            filterOrders(filter);
        });
    });
    
    // Add "All" filter button if it doesn't exist
    const filterContainer = document.querySelector('.filter-buttons');
    if (filterContainer) {
        const allFilterExists = Array.from(filterButtons).some(btn => btn.dataset.filter === 'all');
        
        if (!allFilterExists) {
            const allFilterBtn = document.createElement('button');
            allFilterBtn.className = 'filter-btn active';
            allFilterBtn.dataset.filter = 'all';
            allFilterBtn.textContent = 'All';
            
            // Add event listener
            allFilterBtn.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to this button
                this.classList.add('active');
                // Filter orders
                filterOrders('all');
            });
            
            // Insert at the beginning
            filterContainer.insertBefore(allFilterBtn, filterContainer.firstChild);
        }
    }
});