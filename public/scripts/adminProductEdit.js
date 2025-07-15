document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const editPopup = document.getElementById('editProductPopup');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner"></i>
            <p>Processing...</p>
        </div>
    `;
    document.body.appendChild(loadingOverlay);

    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Show loading overlay
    function showLoading() {
        loadingOverlay.classList.add('active');
    }

    // Hide loading overlay
    function hideLoading() {
        loadingOverlay.classList.remove('active');
    }

    // Show toast message
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }

    // Handle edit button clicks
    document.addEventListener('click', async function(e) {
        if (e.target.closest('.edit-btn')) {
            e.preventDefault();
            const editBtn = e.target.closest('.edit-btn');
            const productId = editBtn.dataset.productId;
            
            try {
                showLoading();
                editPopup.innerHTML = `
                    <div class="edit-popup-content">
                        <div style="text-align: center; padding: 2rem;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
                            <p>Loading product data...</p>
                        </div>
                    </div>
                `;
                editPopup.classList.add('active');
                
                // Fetch product data
                const res = await fetch(`/admin/products/edit/${productId}`);
                if (!res.ok) throw new Error('Failed to fetch product data');
                
                const data = await res.json();
                
                if (data.product) {
                    editPopup.innerHTML = `
                        <div class="edit-popup-content">
                            <div class="edit-popup-header">
                                <h3>Edit Product</h3>
                                <p>Update product details and inventory.</p>
                            </div>
                            <button id="closeEditPopup" class="edit-popup-close" title="Close">&times;</button>
                            <form id="editProductForm" class="edit-popup-form" enctype="multipart/form-data" method="POST">
                                <input type="hidden" name="product_id" id="editProductId" value="${data.product.id || data.product._id}">
                                
                                <div class="form-group">
                                    <label for="editName">Product Name</label>
                                    <input type="text" id="editName" name="name" value="${escapeHtml(data.product.name || '')}" required>
                                </div>

                                <div class="form-group">
                                    <label for="editDescription">Description</label>
                                    <textarea id="editDescription" name="description" required>${escapeHtml(data.product.description || '')}</textarea>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="editPrice">Price</label>
                                        <input type="number" id="editPrice" name="price" step="0.01" value="${data.product.price || 0}" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="editStock">Stock</label>
                                        <input type="number" id="editStock" name="stock" value="${data.product.stock || 0}" required>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="editCategory">Category</label>
                                    <select id="editCategory" name="category_id" required>
                                        ${data.categories.map(cat => 
                                            `<option value="${cat.id}" ${cat.id === data.product.category_id ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`
                                        ).join('')}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="editImage">Product Image</label>
                                    <div class="image-upload-group">
                                        <div id="currentEditImagePreview">
                                            ${data.product.images && data.product.images.length && data.product.images[0].url ? 
                                                `<img src="${data.product.images[0].url}" alt="Current Image">` : 
                                                '<span class="no-image">No image</span>'}
                                        </div>
                                        <div class="image-upload-control">
                                            <input type="file" id="editImage" name="image" accept="image/*">
                                            <small>Leave empty to keep current image.</small>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group form-checkbox">
                                    <label>
                                        <input type="checkbox" id="editIsNew" name="is_new" ${data.product.is_new ? 'checked' : ''}>
                                        <span>Mark as New Arrival</span>
                                    </label>
                                </div>

                                <div class="form-actions">
                                    <button type="button" id="cancelEditProduct" class="btn-cancel">Cancel</button>
                                    <button type="submit" class="btn-update">Update Product</button>
                                </div>
                            </form>
                        </div>
                    `;
                    
                    // Set up form submission
                    const editForm = document.getElementById('editProductForm');
                    if (editForm) {
                        editForm.addEventListener('submit', async function(e) {
                            e.preventDefault();
                            const submitBtn = editForm.querySelector('button[type="submit"]');
                            const originalBtnText = submitBtn.innerHTML;
                            submitBtn.disabled = true;
                            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                            showLoading();
                            
                            try {
                                const formData = new FormData(editForm);
                                const response = await fetch(`/admin/products/edit/${productId}`, {
                                    method: 'POST',
                                    body: formData
                                });
                                
                                if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.error || 'Failed to update product');
                                }
                                
                                showToast('Product updated successfully');
                                setTimeout(() => window.location.reload(), 1000);
                            } catch (error) {
                                console.error('Error updating product:', error);
                                showToast(error.message, 'error');
                                submitBtn.disabled = false;
                                submitBtn.innerHTML = originalBtnText;
                            } finally {
                                hideLoading();
                            }
                        });
                    }
                    
                    // Set up close buttons
                    document.getElementById('closeEditPopup')?.addEventListener('click', closePopup);
                    document.getElementById('cancelEditProduct')?.addEventListener('click', closePopup);
                }
            } catch (error) {
                console.error('Error:', error);
                editPopup.innerHTML = `
                    <div class="edit-popup-content">
                        <button id="closeErrorPopup" class="edit-popup-close">&times;</button>
                        <div style="text-align: center; padding: 2rem;">
                            <i class="fas fa-exclamation-circle" style="color: var(--danger); font-size: 2rem;"></i>
                            <h3>Error Loading Product</h3>
                            <p>${escapeHtml(error.message)}</p>
                            <button id="closeErrorBtn" class="btn-secondary" style="margin-top: 1rem;">Close</button>
                        </div>
                    </div>
                `;
                document.getElementById('closeErrorBtn')?.addEventListener('click', closePopup);
            } finally {
                hideLoading();
            }
        }
    });

    // Handle delete button clicks
    document.addEventListener('click', async function(e) {
        if (e.target.closest('.delete-btn')) {
            e.preventDefault();
            const deleteBtn = e.target.closest('.delete-btn');
            const productId = deleteBtn.dataset.productId;
            const productCard = deleteBtn.closest('.product-card');
            
            // Show custom confirmation popup
            const deletePopup = document.getElementById('deleteConfirmPopup');
            deletePopup.setAttribute('aria-hidden', 'false');
            deletePopup.classList.add('active');
            
            // Remove any previous listeners
            const newConfirmBtn = deletePopup.querySelector('#confirmDeleteBtn').cloneNode(true);
            const newCancelBtn = deletePopup.querySelector('#cancelDeleteBtn').cloneNode(true);
            deletePopup.querySelector('#confirmDeleteBtn').replaceWith(newConfirmBtn);
            deletePopup.querySelector('#cancelDeleteBtn').replaceWith(newCancelBtn);

            // Yes button
            newConfirmBtn.onclick = async function() {
                deletePopup.setAttribute('aria-hidden', 'true');
                deletePopup.classList.remove('active');
                try {
                    showLoading();
                    const response = await fetch(`/admin/products/delete/${productId}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) {
                        throw new Error('Failed to delete product');
                    }
                    showToast('Product deleted successfully');
                    if (productCard) {
                        productCard.style.transition = 'all 0.3s ease';
                        productCard.style.opacity = '0';
                        productCard.style.height = '0';
                        productCard.style.margin = '0';
                        productCard.style.padding = '0';
                        productCard.style.border = 'none';
                        setTimeout(() => productCard.remove(), 300);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showToast(error.message, 'error');
                } finally {
                    hideLoading();
                }
            };
            // No button
            newCancelBtn.onclick = function() {
                deletePopup.setAttribute('aria-hidden', 'true');
                deletePopup.classList.remove('active');
            };
        }
    });

    // Close popup when clicking outside
    editPopup.addEventListener('click', function(e) {
        if (e.target === editPopup) {
            closePopup();
        }
    });

    // Function to close popup
    function closePopup() {
        editPopup.classList.remove('active');
    }
});