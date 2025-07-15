document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const filterToggleButton = document.getElementById("filterToggleButton");
  const collapsibleFilters = document.getElementById("collapsibleFilters");
  const searchInput = document.getElementById("searchInput");
  const categorySelect = document.getElementById("categorySelect");
  const sortSelect = document.getElementById("sortSelect");
  const gridViewBtn = document.getElementById("gridViewBtn");
  const listViewBtn = document.getElementById("listViewBtn");
  const productsGrid = document.getElementById("productsGrid");
  const productsListHeader = document.getElementById("productsListHeader");
  const priceRange = document.getElementById("priceRange");
  const priceValue = document.getElementById("priceValue");
  const activeFiltersContainer = document.getElementById("activeFilters");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const paginationBtns = document.querySelectorAll(".pagination-btn");
  const productCards = document.querySelectorAll(".product-card");
  const searchClear = document.getElementById("searchClear");

  // Initialize all components
  initializeFilters();
  initializeSearch();
  initializeViewToggle();
  initializePriceRange();
  initializeProductCards();
  initializePagination();

  // Filter functionality
  function initializeFilters() {
    // Mobile filter toggle
    if (filterToggleButton && collapsibleFilters) {
      filterToggleButton.addEventListener("click", () => {
        collapsibleFilters.classList.toggle("open");
        const toggleIcon = filterToggleButton.querySelector(".toggle-icon");
        if (toggleIcon) {
          toggleIcon.style.transform = collapsibleFilters.classList.contains("open") ? "rotate(180deg)" : "rotate(0deg)";
        }
        filterToggleButton.classList.toggle("active");
      });
    }

    // Filter change handlers
    if (categorySelect) {
      categorySelect.addEventListener("change", handleFilterChange);
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", handleFilterChange);
    }

    // Clear all filters
    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", clearAllFilters);
    }

    // Update active filters display
    updateActiveFilters();
  }

  function initializeSearch() {
    let searchTimeout;

    // Search input handler with debounce
    searchInput.addEventListener("input", function () {
      const value = this.value.trim();

      // Show/hide clear button
      if (searchClear) {
        searchClear.style.display = value ? "flex" : "none";
      }

      // Debounced search
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (value.length >= 3 || value.length === 0) {
          handleFilterChange();
        }
      }, 500);
    });

    // Enter key handler
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleFilterChange();
      }
    });
  }

  function initializeViewToggle() {
    // Load saved preference
    const savedView = localStorage.getItem("productsViewPreference") || "grid";
    setView(savedView);

    // Event listeners
    gridViewBtn.addEventListener("click", () => setView("grid"));
    listViewBtn.addEventListener("click", () => setView("list"));

    function setView(view) {
      // Add transition class
      productsGrid.classList.add("view-changing");

      setTimeout(() => {
        if (view === "list") {
          productsGrid.classList.remove("grid-view");
          productsGrid.classList.add("list-view");
          listViewBtn.classList.add("active");
          gridViewBtn.classList.remove("active");

          // Show list header
          if (productsListHeader) {
            productsListHeader.style.display = "grid";
          }

          // Show list content, hide grid content
          document.querySelectorAll(".product-card").forEach((card) => {
            const gridContent = card.querySelector(".grid-content");
            const listContent = card.querySelector(".list-content");

            if (gridContent) gridContent.style.display = "none";
            if (listContent) listContent.style.display = "contents";
          });
        } else {
          productsGrid.classList.remove("list-view");
          productsGrid.classList.add("grid-view");
          gridViewBtn.classList.add("active");
          listViewBtn.classList.remove("active");

          // Hide list header
          if (productsListHeader) {
            productsListHeader.style.display = "none";
          }

          // Show grid content, hide list content
          document.querySelectorAll(".product-card").forEach((card) => {
            const gridContent = card.querySelector(".grid-content");
            const listContent = card.querySelector(".list-content");

            if (gridContent) gridContent.style.display = "block";
            if (listContent) listContent.style.display = "none";
          });
        }

        localStorage.setItem("productsViewPreference", view);

        // Remove transition class
        setTimeout(() => {
          productsGrid.classList.remove("view-changing");
        }, 50);
      }, 150);
    }
  }

  function initializePriceRange() {
    if (priceRange && priceValue) {
      priceRange.addEventListener("input", function () {
        priceValue.textContent = this.value;
      });

      priceRange.addEventListener("change", handleFilterChange);
    }
  }

  function initializeProductCards() {
    productCards.forEach((card) => {
      // Add hover effects for grid view only
      card.addEventListener("mouseenter", function () {
        if (productsGrid.classList.contains("grid-view")) {
          this.style.transform = "translateY(-8px) scale(1.02)";
        }
      });

      card.addEventListener("mouseleave", function () {
        if (productsGrid.classList.contains("grid-view") && !this.classList.contains("out-of-stock")) {
          this.style.transform = "";
        }
      });

      // Notify me functionality
      const notifyBtns = card.querySelectorAll(".notify-btn, .list-notify-btn");
      notifyBtns.forEach((btn) => {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();

          const productId = this.dataset.productId || card.dataset.productId;
          notifyWhenAvailable(productId, this);
        });
      });
    });
  }

  function initializePagination() {
    paginationBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        if (this.disabled || this.classList.contains("active")) return;

        const page = this.textContent.trim();
        if (page === "Previous" || page === "Next") {
          // Handle prev/next logic
          handlePagination(page);
        } else if (!isNaN(page)) {
          // Handle number pagination
          changePage(Number.parseInt(page));
        }
      });
    });
  }

  // Filter handling functions
  function handleFilterChange() {
    const searchValue = searchInput?.value.trim() || "";
    const categoryValue = categorySelect?.value || "all";
    const sortValue = sortSelect?.value || "name";
    const priceValue = priceRange?.value || "5000";

    // Show loading state
    showLoadingState();

    // Simulate API call
    setTimeout(() => {
      // Update URL parameters
      updateUrlParams({
        search: searchValue,
        category: categoryValue,
        sort: sortValue,
        maxPrice: priceValue,
        page: 1,
      });

      // Update active filters
      updateActiveFilters();

      // Hide loading state
      hideLoadingState();

      // Update results count
      updateResultsCount();
    }, 800);
  }

  function updateUrlParams(params) {
    const url = new URL(window.location);

    Object.keys(params).forEach((key) => {
      if (params[key] && params[key] !== "all" && params[key] !== "") {
        url.searchParams.set(key, params[key]);
      } else {
        url.searchParams.delete(key);
      }
    });

    // Don't reload the page, just update URL
    window.history.pushState({}, "", url);
  }

  function updateActiveFilters() {
    const filters = [];

    const searchValue = searchInput?.value.trim();
    const categoryValue = categorySelect?.value;
    const sortValue = sortSelect?.value;
    const priceValue = priceRange?.value;

    if (searchValue) {
      filters.push({ type: "search", value: searchValue, label: `Search: "${searchValue}"` });
    }

    if (categoryValue && categoryValue !== "all") {
      filters.push({ type: "category", value: categoryValue, label: `Category: ${categoryValue}` });
    }

    if (sortValue && sortValue !== "name") {
      const sortLabels = {
        "price-low": "Price: Low to High",
        "price-high": "Price: High to Low",
        rating: "Highest Rated",
        newest: "Newest First",
        popular: "Most Popular",
      };
      filters.push({ type: "sort", value: sortValue, label: sortLabels[sortValue] });
    }

    if (priceValue && priceValue !== "5000") {
      filters.push({ type: "price", value: priceValue, label: `Max Price: ₦${priceValue}` });
    }

    // Clear existing filters
    activeFiltersContainer.innerHTML = "";

    // Add filter tags
    filters.forEach((filter) => {
      const filterTag = document.createElement("div");
      filterTag.className = "filter-tag slide-in";
      filterTag.innerHTML = `
                ${filter.label}
                <button onclick="removeFilter('${filter.type}', '${filter.value}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
      activeFiltersContainer.appendChild(filterTag);
    });

    // Show/hide clear all button
    if (clearAllBtn) {
      clearAllBtn.style.display = filters.length > 0 ? "flex" : "none";
    }
  }

  function clearAllFilters() {
    // Reset all filter inputs
    searchInput.value = "";
    document.getElementById("searchClear").style.display = "none";
    categorySelect.value = "all";
    sortSelect.value = "name";
    priceRange.value = "5000";
    if (priceValue) priceValue.textContent = "5000";

    // Clear URL parameters
    window.history.pushState({}, "", window.location.pathname);

    // Update display
    updateActiveFilters();
    handleFilterChange();
  }

  function notifyWhenAvailable(productId, button) {
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting up...';
    button.disabled = true;

    setTimeout(() => {
      button.innerHTML = '<i class="fas fa-check"></i> Notification Set!';
      button.style.background = "var(--success)";

      showNotification("You will be notified when this product is back in stock!", "success");

      setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.background = "";
        button.disabled = false;
      }, 3000);
    }, 1000);
  }

  // Utility functions
  function showLoadingState() {
    productsGrid.classList.add("loading");
  }

  function hideLoadingState() {
    productsGrid.classList.remove("loading");
  }

  function updateResultsCount() {
    const count = document.querySelectorAll(".product-card").length;
    document.getElementById("resultsCount").innerHTML = `<span class="results-number">${count}</span> products found`;
  }

  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animation
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // Global functions for inline event handlers
  window.removeFilter = (type, value) => {
    switch (type) {
      case "search":
        searchInput.value = "";
        document.getElementById("searchClear").style.display = "none";
        break;
      case "category":
        categorySelect.value = "all";
        break;
      case "sort":
        sortSelect.value = "name";
        break;
      case "price":
        priceRange.value = "5000";
        if (priceValue) priceValue.textContent = "5000";
        break;
    }
    handleFilterChange();
  };
});