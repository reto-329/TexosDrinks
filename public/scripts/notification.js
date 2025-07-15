// Notification System
const notification = {
    show: function(message, type = 'success', duration = 3000) {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        
        // Add icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        
        notif.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to DOM
        document.body.appendChild(notif);
        
        // Show notification with animation
        setTimeout(() => notif.classList.add('show'), 10);
        
        // Add close button functionality
        const closeBtn = notif.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        });
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notif.parentNode) {
                    notif.classList.remove('show');
                    setTimeout(() => notif.remove(), 300);
                }
            }, duration);
        }
        
        return notif;
    },
    
    success: function(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },
    
    error: function(message, duration = 3000) {
        return this.show(message, 'error', duration);
    },
    
    info: function(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
};

// Make notification available globally
window.notification = notification;