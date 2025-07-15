document.addEventListener('DOMContentLoaded', function() {
    let currentPage = 1;
    const itemsPerPage = 10;
    let allUsers = [];
    
    // Fetch users from API
    async function fetchUsers() {
        try {
            const response = await fetch('/admin/api/users', {
                headers: {
                    'CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            
            const data = await response.json();
            if (data.success) {
                allUsers = data.users;
                renderUsers();
                setupPagination();
            } else {
                showError('Failed to load users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            showError('Failed to load users');
        }
    }
    
    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Render users table
    function renderUsers() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const usersToDisplay = allUsers.slice(startIndex, endIndex);
        
        // Desktop view (table)
        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = '';
        
        if (usersToDisplay.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="5" class="empty-table">No users found</td>';
            tableBody.appendChild(emptyRow);
        } else {
            usersToDisplay.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.phonenumber}</td>
                    <td>${formatDate(user.created_at)}</td>
                    <td>
                        <button class="delete-btn" data-id="${user.id}" title="Delete User">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
        
        // Mobile view (cards)
        const cardContainer = document.getElementById('userCardContainer');
        cardContainer.innerHTML = '';
        
        if (usersToDisplay.length === 0) {
            cardContainer.innerHTML = '<div class="empty-message">No users found</div>';
        } else {
            usersToDisplay.forEach(user => {
                const card = document.createElement('div');
                card.className = 'order-card';
                card.innerHTML = `
                    <div class="order-card-header">
                        <h3>${user.username}</h3>
                        <span class="order-id">ID: ${user.id}</span>
                    </div>
                    <div class="order-card-details">
                        <div class="detail-item">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${user.email}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Phone:</span>
                            <span class="detail-value">${user.phonenumber}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Registered:</span>
                            <span class="detail-value">${formatDate(user.created_at)}</span>
                        </div>
                        <div class="card-actions">
                            <button class="delete-btn" data-id="${user.id}" title="Delete User">
                                <i class="fas fa-trash-alt"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
                cardContainer.appendChild(card);
            });
        }
    }
    
    // Setup pagination
    function setupPagination() {
        const totalPages = Math.ceil(allUsers.length / itemsPerPage);
        
        // Desktop pagination
        const paginationContainer = document.getElementById('paginationContainer');
        renderPagination(paginationContainer, totalPages);
        
        // Mobile pagination
        const mobilePaginationContainer = document.getElementById('mobilePaginationContainer');
        renderPagination(mobilePaginationContainer, totalPages);
    }
    
    // Render pagination controls
    function renderPagination(container, totalPages) {
        container.innerHTML = '';
        
        if (totalPages <= 1) {
            return;
        }
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-btn prev';
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderUsers();
                setupPagination();
            }
        });
        container.appendChild(prevButton);
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        if (startPage > 1) {
            const firstPageBtn = document.createElement('button');
            firstPageBtn.className = 'pagination-btn';
            firstPageBtn.textContent = '1';
            firstPageBtn.addEventListener('click', () => {
                currentPage = 1;
                renderUsers();
                setupPagination();
            });
            container.appendChild(firstPageBtn);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                container.appendChild(ellipsis);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderUsers();
                setupPagination();
            });
            container.appendChild(pageBtn);
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                container.appendChild(ellipsis);
            }
            
            const lastPageBtn = document.createElement('button');
            lastPageBtn.className = 'pagination-btn';
            lastPageBtn.textContent = totalPages;
            lastPageBtn.addEventListener('click', () => {
                currentPage = totalPages;
                renderUsers();
                setupPagination();
            });
            container.appendChild(lastPageBtn);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-btn next';
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderUsers();
                setupPagination();
            }
        });
        container.appendChild(nextButton);
    }
    
    // Show error message
    function showError(message) {
        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = `<tr><td colspan="5" class="error-message">${message}</td></tr>`;
        
        const cardContainer = document.getElementById('userCardContainer');
        cardContainer.innerHTML = `<div class="error-message">${message}</div>`;
    }
    
    // Modal elements
    const modal = document.getElementById('deleteModal');
    const closeModal = document.querySelector('.close-modal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    let userIdToDelete = null;
    
    // Show delete confirmation modal
    function showDeleteModal(userId) {
        userIdToDelete = userId;
        modal.style.display = 'block';
    }
    
    // Hide delete confirmation modal
    function hideDeleteModal() {
        modal.style.display = 'none';
        userIdToDelete = null;
    }
    
    // Close modal when clicking the X
    if (closeModal) {
        closeModal.addEventListener('click', hideDeleteModal);
    }
    
    // Close modal when clicking Cancel
    if (cancelDelete) {
        cancelDelete.addEventListener('click', hideDeleteModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideDeleteModal();
        }
    });
    
    // Delete user when confirmed
    if (confirmDelete) {
        confirmDelete.addEventListener('click', async () => {
            if (userIdToDelete) {
                await deleteUser(userIdToDelete);
                hideDeleteModal();
            }
        });
    }
    
    // Delete user
    async function deleteUser(userId) {
        try {
            const response = await fetch(`/admin/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete user');
            }
            
            const data = await response.json();
            if (data.success) {
                // Remove user from the array
                allUsers = allUsers.filter(user => user.id !== parseInt(userId));
                
                // Re-render the table
                renderUsers();
                setupPagination();
                
                // Show success message
                showNotification('User deleted successfully', 'success');
            } else {
                throw new Error(data.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('Failed to delete user', 'error');
        }
    }
    
    // Show notification
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
    
    // Event delegation for delete buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-btn')) {
            const userId = e.target.closest('.delete-btn').dataset.id;
            showDeleteModal(userId);
        }
    });
    
    // Initialize
    fetchUsers();
});