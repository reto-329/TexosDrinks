document.addEventListener('DOMContentLoaded', () => {
  // Initialize all components
  initializeQuantitySelector();
  initializeActionButtons();
  initializeProductTabs();
  initializeImageGallery();
  
  function initializeQuantitySelector() {
    const qtyInput = document.getElementById('qtyInput');
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    const maxQty = Number(qtyInput?.max) || 1;
    const minQty = Number(qtyInput?.min) || 1;
    const productId = window.productId || (window.location.pathname.split('/').pop());
    const storageKey = `qty_${productId}`;

    // Restore previous quantity if available
    const savedQty = localStorage.getItem(storageKey);
    if (qtyInput && savedQty && !isNaN(savedQty)) {
      const numValue = parseInt(savedQty);
      if (numValue >= minQty && numValue <= maxQty) {
        qtyInput.value = numValue;
      }
    }

    function setQty(val) {
      val = Math.max(minQty, Math.min(maxQty, parseInt(val) || minQty));
      qtyInput.value = val;
      localStorage.setItem(storageKey, val.toString());
    }

    if (qtyMinus && qtyInput) {
      qtyMinus.addEventListener('click', function() {
        setQty(Number(qtyInput.value) - 1);
      });
    }
    
    if (qtyPlus && qtyInput) {
      qtyPlus.addEventListener('click', function() {
        setQty(Number(qtyInput.value) + 1);
      });
    }
    
    if (qtyInput) {
      qtyInput.addEventListener('change', function() {
        setQty(this.value);
      });
      
      qtyInput.addEventListener('input', function() {
        // Validate input in real-time
        let value = parseInt(this.value) || minQty;
        if (value < minQty) value = minQty;
        if (value > maxQty) value = maxQty;
        this.value = value;
      });
    }
  }
  
  function initializeActionButtons() {
    const shareBtn = document.getElementById('shareBtn');
    const notifyBtn = document.getElementById('notifyBtn');
    
    // Share button
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        shareProduct();
      });
    }
    
    // Notify button
    if (notifyBtn) {
      notifyBtn.addEventListener('click', function(e) {
        e.preventDefault();
        notifyWhenAvailable(this.dataset.productId || 'product-1', this);
      });
    }
  }
  
  function initializeImageGallery() {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const thumbPrev = document.getElementById('thumbPrev');
    const thumbNext = document.getElementById('thumbNext');
    
    if (thumbnails.length > 0) {
      // Thumbnail click handler
      thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
          const newSrc = this.dataset.image;
          if (newSrc && mainImage) {
            mainImage.src = newSrc;
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
          }
        });
      });
      
      // Thumbnail navigation
      if (thumbPrev && thumbNext) {
        let currentIndex = 0;
        
        thumbPrev.addEventListener('click', () => {
          currentIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length;
          updateGallery(currentIndex);
        });
        
        thumbNext.addEventListener('click', () => {
          currentIndex = (currentIndex + 1) % thumbnails.length;
          updateGallery(currentIndex);
        });
        
        function updateGallery(index) {
          const thumb = thumbnails[index];
          if (thumb && mainImage) {
            mainImage.src = thumb.dataset.image;
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
          }
        }
      }
    }
  }
  
  function initializeProductTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const tabId = this.dataset.tab;
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Update active panel
        tabPanels.forEach(panel => {
          panel.classList.remove('active');
          if (panel.id === tabId) {
            panel.classList.add('active');
          }
        });
      });
    });
  }
  
  function notifyWhenAvailable(productId, button) {
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting up...';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
      button.innerHTML = '<i class="fas fa-check"></i> Notification Set!';
      button.style.background = "var(--success)";
      
      showNotification("You'll be notified when this product is back in stock!", "success");
      
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.background = "";
        button.disabled = false;
      }, 3000);
    }, 1000);
  }
  
  function shareProduct() {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: 'Check out this product from TexosDrinks',
        url: window.location.href
      }).catch(err => {
        console.log('Error sharing:', err);
        showNotification('Sharing failed', 'error');
      });
    } else {
      // Fallback for browsers without Web Share API
      const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this product: ${window.location.href}`)}`;
      window.open(shareUrl, '_blank');
    }
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
});