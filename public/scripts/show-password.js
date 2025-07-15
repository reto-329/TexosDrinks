// Show/hide password utility for login and register pages
function setupShowPasswordToggles() {
    document.querySelectorAll('.password-input-container').forEach(container => {
        const input = container.querySelector('input[type="password"], input[type="text"]');
        if (!input) return;
        let toggle = container.querySelector('.show-password-toggle');
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'show-password-toggle';
            toggle.innerHTML = '<i class="fa fa-eye"></i>';
            toggle.setAttribute('aria-label', 'Show password');
            container.appendChild(toggle);
        }
        toggle.onclick = function () {
            if (input.type === 'password') {
                input.type = 'text';
                toggle.innerHTML = '<i class="fa fa-eye-slash"></i>';
                toggle.setAttribute('aria-label', 'Hide password');
            } else {
                input.type = 'password';
                toggle.innerHTML = '<i class="fa fa-eye"></i>';
                toggle.setAttribute('aria-label', 'Show password');
            }
        };
    });
}

document.addEventListener('DOMContentLoaded', setupShowPasswordToggles);
