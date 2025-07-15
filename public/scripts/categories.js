document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addCategoryBtnMobile = document.getElementById('addCategoryBtnMobile');
    const categoryModal = document.getElementById('categoryModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const categoryForm = document.querySelector('.category-form');
    const editCategoryModal = document.getElementById('editCategoryModal');
    const editModalOverlay = document.getElementById('editModalOverlay');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editCategoryForm = document.getElementById('editCategoryForm');
    const deleteCategoryModal = document.getElementById('deleteCategoryModal');
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const categorySearch = document.getElementById('categorySearch');
    const categoriesTableBody = document.getElementById('categoriesTableBody');
    const categoryCountRealtime = document.getElementById('categoryCountRealtime');
    
    // Variables
    let categories = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let currentEditId = null;
    let currentDeleteId = null;
    let selectedIcon = '';
    let editSelectedIcon = '';

    // Initialize icon selection
    initIconSelection();
    initEditIconSelection();

    // Event Listeners
    addCategoryBtn.addEventListener('click', openAddModal);
    addCategoryBtnMobile.addEventListener('click', openAddModal);
    modalOverlay.addEventListener('click', closeAddModal);
    closeModalBtn.addEventListener('click', closeAddModal);
    cancelBtn.addEventListener('click', closeAddModal);
    editModalOverlay.addEventListener('click', closeEditModal);
    closeEditModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    deleteModalOverlay.addEventListener('click', closeDeleteModal);
    closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', deleteCategory);
    categorySearch.addEventListener('input', handleSearch);
    
    // Form Submission
    categoryForm.addEventListener('submit', handleAddCategory);
    editCategoryForm.addEventListener('submit', handleEditCategory);

    // Initial Load
    fetchCategories();

    // Functions
    function initIconSelection() {
        const iconOptions = document.querySelectorAll('#iconSelector .icon-option');
        iconOptions.forEach(option => {
            option.addEventListener('click', function() {
                iconOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                selectedIcon = this.getAttribute('data-value');
                document.getElementById('selectedIcon').value = selectedIcon;
            });
        });
    }

    function initEditIconSelection() {
        const iconOptions = document.querySelectorAll('#editIconSelector .icon-option');
        iconOptions.forEach(option => {
            option.addEventListener('click', function() {
                iconOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                editSelectedIcon = this.getAttribute('data-icon');
                document.getElementById('editSelectedIcon').value = editSelectedIcon;
            });
        });
    }

    function openAddModal() {
        categoryModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeAddModal() {
        categoryModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        categoryForm.reset();
        document.querySelectorAll('#iconSelector .icon-option').forEach(opt => opt.classList.remove('active'));
        selectedIcon = '';
    }

    function openEditModal(category) {
        currentEditId = category.id;
        document.getElementById('editCategoryId').value = category.id;
        document.getElementById('editCategoryName').value = category.name;
        document.getElementById('editCategoryDesc').value = category.description || '';
        
        // Set icon if exists
        if (category.icon) {
            const iconOption = document.querySelector(`#editIconSelector .icon-option[data-icon="${category.icon}"]`);
            if (iconOption) {
                iconOption.classList.add('active');
                editSelectedIcon = category.icon;
                document.getElementById('editSelectedIcon').value = editSelectedIcon;
            }
        } else {
            document.querySelectorAll('#editIconSelector .icon-option').forEach(opt => opt.classList.remove('active'));
            editSelectedIcon = '';
        }
        
        editCategoryModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeEditModal() {
        editCategoryModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentEditId = null;
    }

    function openDeleteModal(id) {
        currentDeleteId = id;
        deleteCategoryModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeDeleteModal() {
        deleteCategoryModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentDeleteId = null;
    }

    async function fetchCategories() {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) throw new Error('Failed to fetch categories');
            
            const data = await response.json();
            categories = data;
            renderCategories();
            updateCategoryCount();
            updatePagination();
        } catch (error) {
            showNotification('Error fetching categories: ' + error.message, 'error');
            console.error('Error:', error);
        }
    }

    function renderCategories(filteredCategories = null) {
        const dataToRender = filteredCategories || categories;
        categoriesTableBody.innerHTML = '';

        if (dataToRender.length === 0) {
            categoriesTableBody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 2rem;">
                        No categories found. Click "Add Category" to create one.
                    </td>
                </tr>
            `;
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedCategories = dataToRender.slice(startIndex, startIndex + itemsPerPage);

        paginatedCategories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="category-name">
                        ${category.icon ? `<span class="category-icon"><i class="${category.icon}"></i></span>` : ''}
                        <span>${category.name}</span>
                    </div>
                </td>
                <td>${category.description || '--'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" data-id="${category.id}" aria-label="Edit category">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${category.id}" aria-label="Delete category">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            categoriesTableBody.appendChild(row);
        });

        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryId = btn.getAttribute('data-id');
                const category = categories.find(c => c.id == categoryId);
                if (category) openEditModal(category);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryId = btn.getAttribute('data-id');
                openDeleteModal(categoryId);
            });
        });
    }

    function updateCategoryCount() {
        categoryCountRealtime.textContent = categories.length;
    }

    function updatePagination(filteredCategories = null) {
        const dataToPaginate = filteredCategories || categories;
        const totalPages = Math.ceil(dataToPaginate.length / itemsPerPage);
        const paginationInfo = document.querySelector('.pagination-info');
        const paginationControls = document.querySelector('.pagination-controls');

        if (dataToPaginate.length <= itemsPerPage) {
            paginationInfo.innerHTML = '';
            paginationControls.innerHTML = '';
            return;
        }

        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, dataToPaginate.length);

        paginationInfo.innerHTML = `
            Showing <span>${startItem}-${endItem}</span> of <span>${dataToPaginate.length}</span> categories
        `;

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} id="prevPage">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} id="nextPage">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationControls.innerHTML = paginationHTML;

        // Add event listeners to pagination buttons
        document.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPage = parseInt(btn.getAttribute('data-page'));
                renderCategories(filteredCategories);
                updatePagination(filteredCategories); // Update pagination after render
            });
        });

        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCategories(filteredCategories);
                updatePagination(filteredCategories); // Update pagination after render
            }
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderCategories(filteredCategories);
                updatePagination(filteredCategories); // Update pagination after render
            }
        });
    }

    function handleSearch() {
        const searchTerm = categorySearch.value.toLowerCase();
        if (!searchTerm) {
            currentPage = 1;
            renderCategories();
            updatePagination();
            return;
        }

        const filteredCategories = categories.filter(category => 
            category.name.toLowerCase().includes(searchTerm) || 
            (category.description && category.description.toLowerCase().includes(searchTerm))
        );

        currentPage = 1;
        renderCategories(filteredCategories);
        updatePagination(filteredCategories);
    }

    async function handleAddCategory(e) {
        e.preventDefault();
        
        const name = document.getElementById('categoryName').value;
        const description = document.getElementById('categoryDescription').value;
        const icon = document.getElementById('selectedIcon').value;

        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, description, icon }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add category');
            }

            const newCategory = await response.json();
            categories.unshift(newCategory); // Add to beginning of array
            renderCategories();
            updateCategoryCount();
            updatePagination();
            closeAddModal();
            showNotification('Category added successfully!', 'success');
        } catch (error) {
            showNotification('Error adding category: ' + error.message, 'error');
            console.error('Error:', error);
        }
    }

    async function handleEditCategory(e) {
        e.preventDefault();
        
        const id = document.getElementById('editCategoryId').value;
        const name = document.getElementById('editCategoryName').value;
        const description = document.getElementById('editCategoryDesc').value;
        const icon = document.getElementById('editSelectedIcon').value;

        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, description, icon }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update category');
            }

            const updatedCategory = await response.json();
            const index = categories.findIndex(c => c.id == id);
            if (index !== -1) {
                categories[index] = updatedCategory;
            }
            renderCategories();
            closeEditModal();
            showNotification('Category updated successfully!', 'success');
        } catch (error) {
            showNotification('Error updating category: ' + error.message, 'error');
            console.error('Error:', error);
        }
    }

    async function deleteCategory() {
        if (!currentDeleteId) return;

        try {
            const response = await fetch(`/api/categories/${currentDeleteId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete category');
            }

            categories = categories.filter(c => c.id != currentDeleteId);
            renderCategories();
            updateCategoryCount();
            updatePagination();
            closeDeleteModal();
            showNotification('Category deleted successfully!', 'success');
        } catch (error) {
            showNotification('Error deleting category: ' + error.message, 'error');
            console.error('Error:', error);
        }
    }

    function showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }
});