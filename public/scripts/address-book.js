// Address Book JavaScript
let currentAddressId = null;

// Modal Functions
function showAddAddressModal() {
  document.querySelector(".modal-title").textContent = "Add New Address";
  document.getElementById("addressForm").reset();
  currentAddressId = null;
  document.getElementById("addressModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function hideAddressModal() {
  document.getElementById("addressModal").classList.remove("active");
  document.body.style.overflow = "";
  currentAddressId = null;
}

function showDeleteModal(addressId) {
  currentAddressId = addressId;
  document.getElementById("deleteModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function hideDeleteModal() {
  document.getElementById("deleteModal").classList.remove("active");
  document.body.style.overflow = "";
  currentAddressId = null;
}

function editAddress(addressId) {
  currentAddressId = addressId;
  document.querySelector(".modal-title").textContent = "EDIT ADDRESS";
  document.getElementById("addressModal").classList.add("active");
  document.body.style.overflow = "hidden";

  fetch(`/address-book/${addressId}`, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  })
  .then(async (res) => {
    if (res.ok) {
      const address = await res.json();
      const form = document.getElementById("addressForm");
      form.elements["first_name"].value = address.first_name || '';
      form.elements["last_name"].value = address.last_name || '';
      form.elements["phone"].value = address.phone || '';
      form.elements["additional_phone"].value = address.additional_phone || '';
      form.elements["street"].value = address.street || '';
      form.elements["additional_info"].value = address.additional_info || '';
      form.elements["state"].value = address.state || '';
      form.elements["city"].value = address.city || '';
      form.elements["country"].value = address.country || '';
      form.elements["zip"].value = address.zip || '';
      form.elements["is_default"].value = address.is_default ? "true" : "false";
    } else {
      showToast("Failed to load address data", "error");
    }
  })
  .catch(() => {
    showToast("Network error. Please try again.", "error");
  });
}

function renderAddress(address) {
  const addressList = document.querySelector(".address-list");
  const noAddressMessage = addressList.querySelector(".empty-addresses");
  if (noAddressMessage) {
    noAddressMessage.remove();
  }

  const addressItem = document.createElement("div");
  addressItem.className = "address-item";
  addressItem.dataset.id = address.id;

  addressItem.innerHTML = `
    <div class="address-content">
      <div class="address-name">${address.first_name || 'Customer'} ${address.last_name || ''}</div>
      <div class="address-details">
        ${address.street}${address.additional_info ? `, ${address.additional_info}` : ''} - ${address.city}
      </div>
      <div class="address-phone">+234 ${address.phone}</div>
      ${address.is_default ? '<div class="default-label">DEFAULT ADDRESS</div>' : ''}
    </div>
    <div class="address-actions">
      <button class="edit-link" onclick="editAddress('${address.id}')" title="Edit address">
        <i class="fas fa-edit"></i>
      </button>
      <button class="delete-link" onclick="showDeleteModal('${address.id}')" title="Delete address">
        <i class="fas fa-trash-alt"></i>
      </button>
      ${!address.is_default ? 
        `<button class="star-btn" onclick="setDefaultAddress('${address.id}')" data-id="${address.id}" title="Set as default">
          <i class="far fa-star"></i>
        </button>` : 
        `<button class="star-btn default" disabled title="Default address">
          <i class="fas fa-star"></i>
        </button>`
      }
    </div>
  `;

  addressList.appendChild(addressItem);
  
  setTimeout(() => {
    addressItem.style.opacity = "1";
  }, 10);
}

// Form validation
function validateForm(form) {
  let isValid = true;
  
  // Reset error states
  form.querySelectorAll('.form-group').forEach(group => {
    group.classList.remove('error');
    const errorMsg = group.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();
  });

  // Validate required fields
  const requiredFields = form.querySelectorAll('[required]');
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      showFieldError(field, 'This field is required');
      isValid = false;
    }
  });

  // Phone number validation
  const phoneField = form.querySelector('[name="phone"]');
  if (phoneField) {
    const phoneValue = phoneField.value.trim();
    if (phoneValue && !/^0[0-9]{10}$/.test(phoneValue)) {
      showFieldError(phoneField, 'Must be 11 digits starting with 0 (e.g., 08012345678)');
      isValid = false;
    }
  }

  // Additional phone validation
  const additionalPhoneField = form.querySelector('[name="additional_phone"]');
  if (additionalPhoneField && additionalPhoneField.value.trim() !== '') {
    if (!/^0[0-9]{10}$/.test(additionalPhoneField.value.trim())) {
      showFieldError(additionalPhoneField, 'Must be 11 digits starting with 0 (e.g., 08012345678)');
      isValid = false;
    }
  }

  return isValid;
}

function showFieldError(field, message) {
  const formGroup = field.closest('.form-group');
  if (!formGroup) return;

  formGroup.classList.add('error');
  
  // Remove any existing error message
  const existingError = formGroup.querySelector('.error-message');
  if (existingError) existingError.remove();

  // Create and append new error message
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  
  // Insert after the input container
  const inputContainer = field.closest('.phone-input-container') || field;
  inputContainer.insertAdjacentElement('afterend', errorElement);
}

function saveAddress() {
  const form = document.getElementById("addressForm");
  if (!form) {
    showToast("Form not found", "error");
    return;
  }
  
  // Client-side validation
  if (!validateForm(form)) {
    return;
  }

  const formData = new FormData(form);
  
  // Handle hidden is_default field
  const isDefaultElement = form.elements["is_default"];
  
  // Check if this is the first address (no addresses in the list)
  const addressItems = document.querySelectorAll('.address-item');
  const isFirstAddress = addressItems.length === 0 && !currentAddressId;
  
  // For new addresses (no currentAddressId)
  if (!currentAddressId) {
    // If it's the first address ever, force it to be default
    if (isFirstAddress) {
      formData.set("is_default", "true");
    } else {
      formData.set("is_default", "false");
    }
  }
  
  // Show loading state
  const saveBtn = document.querySelector(".btn-save");
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "Saving...";
  saveBtn.disabled = true;

  // Determine if this is a create or update operation
  const url = currentAddressId ? `/address-book/${currentAddressId}` : "/address-book";
  const method = currentAddressId ? "PUT" : "POST";

  // Send data to server via AJAX
  fetch(url, {
    method: method,
    headers: {
      "Accept": "application/json"
    },
    body: formData
  })
    .then(async (res) => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      
      if (res.ok) {
        const { address } = await res.json();
        hideAddressModal();
        showSuccessMessage("Address saved successfully!");
        location.reload();
      } else {
        const data = await res.json();
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(error => {
            showToast(error, "error");
          });
        } else {
          showToast("Failed to save address", "error");
        }
      }
    })
    .catch(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      showToast("Network error. Please try again.", "error");
    });
}

function confirmDelete() {
  if (!currentAddressId) return;

  // Show loading state
  const deleteBtn = document.querySelector(".btn-delete");
  const originalText = deleteBtn.innerHTML;
  deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
  deleteBtn.disabled = true;

  // Send delete request to server
  fetch(`/address-book/${currentAddressId}`, {
    method: "DELETE",
    headers: {
      "Accept": "application/json"
    }
  })
  .then(async (res) => {
    if (res.ok) {
      hideDeleteModal();
      showSuccessMessage("Address deleted successfully!");
      location.reload();
    } else {
      const data = await res.json();
      showToast(data.message || "Failed to delete address", "error");
    }
  })
  .catch(() => {
    showToast("Network error. Please try again.", "error");
  })
  .finally(() => {
    // Reset button
    deleteBtn.innerHTML = originalText;
    deleteBtn.disabled = false;
  });
}

function setDefaultAddress(addressId) {
  const btn = document.querySelector(`button.star-btn[data-id="${addressId}"]`);
  if (!btn) return;
  
  const originalIcon = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  btn.disabled = true;

  // Send request to server
  fetch(`/address-book/${addressId}/default`, {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ is_default: true })
  })
  .then(async (res) => {
    if (res.ok) {
      showSuccessMessage("Default address updated successfully!");
      setTimeout(() => {
        location.reload();
      }, 1500);
    } else {
      const data = await res.json();
      showToast(data.message || "Failed to update default address", "error");
      btn.innerHTML = originalIcon;
      btn.disabled = false;
    }
  })
  .catch(() => {
    showToast("Network error. Please try again.", "error");
    btn.innerHTML = originalIcon;
    btn.disabled = false;
  });
}

function showSuccessMessage(message) {
  const toast = document.createElement("div");
  toast.className = "toast success";
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Show animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 100);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  // Add toast styles if not already present
  if (!document.querySelector(".toast-styles")) {
    const style = document.createElement("style");
    style.className = "toast-styles";
    style.textContent = `
      .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--white);
        color: var(--dark);
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        transform: translateX(calc(100% + 20px));
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        display: flex;
        align-items: center;
        border-left: 4px solid var(--success);
      }
      .toast.show {
        transform: translateX(0);
      }
      .toast.success {
        background: var(--white);
        border-left-color: var(--success);
      }
      .toast.error {
        border-left-color: var(--primary);
      }
      .toast-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .toast i {
        font-size: 1.25rem;
      }
      .toast.success i {
        color: var(--success);
      }
      .toast.success i.fa-check-circle {
        animation: bounce 0.5s;
      }
      @keyframes bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => toast.classList.add("show"), 100);

  // Hide and remove toast
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Close modals when clicking outside
  document.getElementById("addressModal").addEventListener("click", function (e) {
    if (e.target === this) hideAddressModal();
  });

  document.getElementById("deleteModal").addEventListener("click", function (e) {
    if (e.target === this) hideDeleteModal();
  });

  // Close modals with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (document.getElementById("addressModal").classList.contains("active")) {
        hideAddressModal();
      }
      if (document.getElementById("deleteModal").classList.contains("active")) {
        hideDeleteModal();
      }
    }
  });

  // Handle form submission
  document.getElementById("addressForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveAddress();
  });

  // Real-time validation for phone fields
  document.querySelectorAll('[name="phone"], [name="additional_phone"]').forEach(input => {
    input.addEventListener('input', function(e) {
      // Remove any non-digit characters
      this.value = this.value.replace(/[^0-9]/g, '');
      
      // Validate length
      if (this.value.length > 11) {
        this.value = this.value.slice(0, 11);
      }
      
      // Get the form group
      const formGroup = this.closest('.form-group');
      if (formGroup) {
        formGroup.classList.remove('error');
        const errorMsg = formGroup.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
      }

      // Validate if field is required
      if (this.hasAttribute('required') && this.value.length === 0) {
        showFieldError(this, 'This field is required');
      } else if (this.value.length > 0 && !/^0[0-9]{10}$/.test(this.value)) {
        showFieldError(this, 'Must be 11 digits starting with 0');
      }
    });
  });
});

// Global functions for inline event handlers
window.showAddAddressModal = showAddAddressModal;
window.hideAddressModal = hideAddressModal;
window.hideDeleteModal = hideDeleteModal;
window.confirmDelete = confirmDelete;
window.editAddress = editAddress;
window.saveAddress = saveAddress;
window.setDefaultAddress = setDefaultAddress;