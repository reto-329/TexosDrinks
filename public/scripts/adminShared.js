// Admin Dashboard & Categories Shared JS
// Handles logout, notifications, and secure navigation

function logoutFromAdminDashboard() {
    fetch('/admin/logout', {
        method: 'POST',
        credentials: 'same-origin'
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

function goHomeAndReplace(e) {
    e.preventDefault();
    window.location.replace('/');
}

function logoutAndGoHome(e) {
    e.preventDefault();
    fetch('/admin/logout', {
        method: 'POST',
        credentials: 'same-origin'
    })
    .then(() => {
        window.location.replace('/');
    });
}

// Real-time update for category count (shared for dashboard and categories pages)
function updateCategoryCountRealtime() {
    // Try dashboard stat
    const dashboardEl = document.getElementById('categoryCountRealtime');
    // Try categories stat
    const categoriesEl = document.querySelector('.stat-value#categoryCountRealtime');
    // Fetch count from API (works for both pages)
    fetch('/admin/categories/count')  // Changed this path
        .then(res => res.json())
        .then(data => {
            // Only use integer value for count
            const count = Number.isInteger(data.total) ? data.total : '--';
            if (dashboardEl) dashboardEl.textContent = count;
            if (categoriesEl) categoriesEl.textContent = count;
        })
        .catch(() => {
            if (dashboardEl) dashboardEl.textContent = '--';
            if (categoriesEl) categoriesEl.textContent = '--';
        });
}

// Only run if the element exists on the page
if (document.getElementById('categoryCountRealtime')) {
    setInterval(updateCategoryCountRealtime, 5000);
    document.addEventListener('DOMContentLoaded', updateCategoryCountRealtime);
}
