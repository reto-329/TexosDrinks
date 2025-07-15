document.addEventListener('DOMContentLoaded', function() {
    // Get the settings form
    const settingsForm = document.querySelector('form[action="/admin/settings"]');
    
    if (settingsForm) {
        // Add validation for the form
        settingsForm.addEventListener('submit', function(e) {
            const thresholdInput = document.getElementById('FREE_DELIVERY_THRESHOLD');
            const feeInput = document.getElementById('DELIVERY_FEE');
            
            // Validate threshold
            if (thresholdInput && (isNaN(thresholdInput.value) || thresholdInput.value < 0)) {
                e.preventDefault();
                alert('Free delivery threshold must be a positive number');
                thresholdInput.focus();
                return;
            }
            
            // Validate fee
            if (feeInput && (isNaN(feeInput.value) || feeInput.value < 0)) {
                e.preventDefault();
                alert('Delivery fee must be a positive number');
                feeInput.focus();
                return;
            }
        });
    }
    
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    if (alerts.length > 0) {
        setTimeout(function() {
            alerts.forEach(alert => {
                alert.style.opacity = '0';
                setTimeout(() => alert.style.display = 'none', 500);
            });
        }, 5000);
    }
});