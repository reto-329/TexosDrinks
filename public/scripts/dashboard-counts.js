// Script to fetch and update dashboard counts
document.addEventListener('DOMContentLoaded', function() {
    // Fetch dashboard counts
    fetch('/api/admin/dashboard-counts')
        .then(response => response.json())
        .then(data => {
            console.log('Dashboard counts from API:', data);
            
            // Update product count
            const productCountElement = document.querySelector('.stat-item:nth-child(1) .stat-number');
            if (productCountElement && data.productCount !== undefined) {
                productCountElement.textContent = data.productCount;
            }
            
            // Update category count
            const categoryCountElement = document.querySelector('.stat-item:nth-child(2) .stat-number');
            if (categoryCountElement && data.categoryCount !== undefined) {
                categoryCountElement.textContent = data.categoryCount;
            }
            
            // Update order count
            const orderCountElement = document.querySelector('.stat-item:nth-child(3) .stat-number');
            if (orderCountElement && data.orderCount !== undefined) {
                orderCountElement.textContent = data.orderCount;
            }
        })
        .catch(error => {
            console.error('Error fetching dashboard counts:', error);
        });
});