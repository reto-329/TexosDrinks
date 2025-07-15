document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const productModal = document.getElementById('productModal');
    const categorySearch = document.getElementById('categorySearch');
    const sortCategories = document.getElementById('sortCategories');
    const categoryGrid = document.getElementById('categoryGrid');
    const paginationContainer = document.getElementById('paginationContainer');
    
    // Get categories from window variable
    const categories = window.categoriesData || [];
    let filteredCategories = [...categories];
    const categoriesPerPage = 6; // Set to 6 as requested
    let currentPage = 1;

    // Modal functions
    window.openModal = function(categoryId, categoryName) {
        document.getElementById('modalCategoryId').value = categoryId;
        document.getElementById('modalCategoryName').textContent = categoryName;
        productModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeModal = function() {
        productModal.classList.remove('active');
        document.getElementById('addProductForm').reset();
        const imagePreview = document.getElementById('imagePreview');
        if(imagePreview) imagePreview.innerHTML = '';
        document.body.style.overflow = '';
    };

    // Pagination logic
    function renderPagination() {
        const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const pageLink = document.createElement('a');
            pageLink.href = '#';
            pageLink.textContent = i;
            pageLink.className = 'page-link' + (i === currentPage ? ' active' : '');
            pageLink.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                renderCategories();
            });
            paginationContainer.appendChild(pageLink);
        }
    }

    function renderCategories() {
        const start = (currentPage - 1) * categoriesPerPage;
        const end = start + categoriesPerPage;
        const pageCategories = filteredCategories.slice(start, end);
        
        categoryGrid.innerHTML = '';
        if (pageCategories.length === 0) {
            categoryGrid.innerHTML = `<div class="empty-state"><img src="/Images/empty-categories.svg" alt="No categories" class="empty-image"><h3>No Matching Categories</h3><p>Try adjusting your search or sort criteria.</p></div>`;
        } else {
            pageCategories.forEach(category => {
                const safeCategoryName = category.name.replace(/'/g, "\\'");
                const card = document.createElement('div');
                card.className = 'category-card';
                card.setAttribute('data-category-id', category._id || category.id);
                card.innerHTML = `
                    <div class="category-info">
                        <div class="category-name">${category.name}</div>
                        <div class="product-count">${category.productCount || 0} products</div>
                    </div>
                    <div class="category-actions">
                        <button class="action-btn view-btn" title="View Products">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn add-btn" title="Add Product" onclick="openModal('${category._id || category.id}', '${safeCategoryName}')">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `;
                categoryGrid.appendChild(card);
            });
        }
        renderPagination();
    }

    function applyFiltersAndSort() {
        let tempCategories = [...categories];

        // Apply search
        const searchTerm = categorySearch.value.toLowerCase();
        if (searchTerm) {
            tempCategories = tempCategories.filter(cat => cat.name.toLowerCase().includes(searchTerm));
        }

        // Apply sort
        const sortValue = sortCategories.value;
        if (sortValue === 'name-asc') {
            tempCategories.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortValue === 'name-desc') {
            tempCategories.sort((a, b) => b.name.localeCompare(a.name));
        } else if (sortValue === 'products-asc') {
            tempCategories.sort((a, b) => (a.productCount || 0) - (b.productCount || 0));
        } else if (sortValue === 'products-desc') {
            tempCategories.sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
        }

        filteredCategories = tempCategories;
        currentPage = 1;
        renderCategories();
    }

    // Event Listeners
    if (categorySearch) {
        categorySearch.addEventListener('input', applyFiltersAndSort);
    }
    if (sortCategories) {
        sortCategories.addEventListener('change', applyFiltersAndSort);
    }

    // Initial Render
    if (categories.length > 0) {
        renderCategories();
    }

    // Event delegation for view products button
    if (categoryGrid) {
        categoryGrid.addEventListener('click', function(e) {
            const btn = e.target.closest('.view-btn');
            if (btn) {
                const card = btn.closest('.category-card');
                const categoryId = card.getAttribute('data-category-id');
                if (categoryId) {
                    window.location.href = `/admin/products/category/${encodeURIComponent(categoryId)}`;
                }
            }
        });
    }

    // --- MODAL & FILE UPLOAD LOGIC ---
    const fileUploadLabel = document.querySelector('.file-upload-label');
    const fileInput = document.querySelector('.file-upload-input');
    const imagePreview = document.getElementById('imagePreview');

    if (fileUploadLabel) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileUploadLabel.addEventListener(eventName, preventDefaults, false);
        });
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        ['dragenter', 'dragover'].forEach(eventName => {
            fileUploadLabel.addEventListener(eventName, () => fileUploadLabel.classList.add('highlight'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            fileUploadLabel.addEventListener(eventName, () => fileUploadLabel.classList.remove('highlight'), false);
        });
        fileUploadLabel.addEventListener('drop', (e) => {
            fileInput.files = e.dataTransfer.files;
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }, false);
    }

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (!imagePreview) return;
            imagePreview.innerHTML = '';
            if (this.files.length > 0) {
                const file = this.files[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        imagePreview.innerHTML = `
                            <div class="preview-image">
                                <img src="${e.target.result}" alt="Preview">
                                <button type="button" class="remove-image" aria-label="Remove image"><i class="fas fa-times"></i></button>
                            </div>
                        `;
                        imagePreview.querySelector('.remove-image').addEventListener('click', () => {
                            fileInput.value = ''; // Clear the file input
                            imagePreview.innerHTML = '';
                        });
                    }
                    reader.readAsDataURL(file);
                }
            }
        });
    }

    // Close modal when clicking outside
    if (productModal) {
        productModal.addEventListener('click', function(e) {
            if (e.target === this) {
                window.closeModal();
            }
        });
    }
});