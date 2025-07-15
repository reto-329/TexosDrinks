document.addEventListener('DOMContentLoaded', function() {
    // Always recreate the toggle button to ensure it works
    // Remove existing button if it exists
    const existingBtn = document.querySelector('.mobile-menu-toggle');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // Create new toggle button
    const btn = document.createElement('button');
    btn.className = 'mobile-menu-toggle';
    btn.innerHTML = '<i class="fas fa-bars"></i>';
    btn.setAttribute('aria-label', 'Toggle menu');
    document.body.appendChild(btn);
    
    // Remove existing overlay if it exists
    const existingOverlay = document.querySelector('.sidebar-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create new overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    
    const sidebar = document.querySelector('.dashboard-sidebar');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    const closeBtn = document.querySelector('.sidebar-close-btn');
    
    if (!sidebar || !toggleBtn) return; // Safety check
    
    // Function to close sidebar
    function closeSidebar() {
        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        overlay.classList.remove('active');
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    }
    
    // Function to open sidebar
    function openSidebar() {
        sidebar.classList.add('active');
        document.body.classList.add('sidebar-open');
        overlay.classList.add('active');
        toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
    }
    
    // Toggle sidebar
    toggleBtn.addEventListener('click', function() {
        if (sidebar.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });
    
    // Close sidebar when clicking X button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when clicking overlay
    overlay.addEventListener('click', closeSidebar);
    
    // Close sidebar when window is resized to desktop size
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
});