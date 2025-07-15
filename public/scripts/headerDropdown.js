// Responsive header dropdown and hamburger for header/header2 (not header3)

document.addEventListener('DOMContentLoaded', function() {
    // Hamburger menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileNav.classList.toggle('hidden');
            mobileMenuBtn.classList.toggle('active');
        });
    }

    // User dropdown (desktop)
    const userDropdownBtn = document.querySelector('.user-dropdown-btn');
    const userDropdownContent = document.querySelector('.user-dropdown-content');
    if (userDropdownBtn && userDropdownContent) {
        userDropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdownContent.classList.toggle('show');
            userDropdownBtn.setAttribute('aria-expanded', userDropdownContent.classList.contains('show'));
        });
        // Close dropdown on outside click
        document.addEventListener('click', function(e) {
            if (!userDropdownContent.contains(e.target) && !userDropdownBtn.contains(e.target)) {
                userDropdownContent.classList.remove('show');
                userDropdownBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Hide mobile nav on resize (if desktop)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 900 && mobileNav && !mobileNav.classList.contains('hidden')) {
            mobileNav.classList.add('hidden');
            mobileMenuBtn.classList.remove('active');
        }
    });
});
