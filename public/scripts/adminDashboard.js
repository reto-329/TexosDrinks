// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    sidebar.classList.toggle('active');
}
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-toggle';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuBtn.onclick = toggleSidebar;
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) {
        dashboardContainer.insertBefore(mobileMenuBtn, dashboardContainer.firstChild);
    }
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.dashboard-sidebar');
        const mobileBtn = document.querySelector('.mobile-menu-toggle');
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !mobileBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
});
function logoutFromAdminDashboard() {
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'x-csrf-token': csrfToken
        }
    })
    .then(() => {
        showLogoutNotification('/adminLogin');
    });
}
function showLogoutNotification(redirectUrl) {
    let notification = document.createElement('div');
    notification.className = 'logout-notification';
    notification.textContent = 'You have been logged out.';
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
        window.location.href = redirectUrl;
    }, 2000);
}

