function validateEmail(email) {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhoneNumber(phone) {
    // Only digits, exactly 11 characters
    return /^\d{11}$/.test(phone);
}

const registerForm = document.getElementById('registerForm');
const otpSection = document.createElement('div');
otpSection.style.display = 'none';
otpSection.innerHTML = `
    <div class="form-group floating-label-group">
        <input type="text" id="otpInput" class="form-input" placeholder="Enter OTP" required />
        <label for="otpInput" class="floating-label">OTP</label>
    </div>
    <button type="button" id="verifyOtpBtn" class="auth-submit-btn">Verify OTP</button>
`;
registerForm.parentNode.appendChild(otpSection);

let pendingEmail = '';
let pendingData = {};

registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const phonenumber = form.phonenumber.value;

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    if (!validatePhoneNumber(phonenumber)) {
        alert('Phone number must be exactly 11 digits.');
        return;
    }

    const data = {
        username: form.username.value,
        email: email,
        phonenumber: phonenumber,
        password: form.password.value
    };
    const response = await fetch('/api/users/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if (response.ok) {
        alert('OTP sent to your email.');
        pendingEmail = email;
        pendingData = data;
        registerForm.style.display = 'none';
        otpSection.style.display = 'block';
    } else {
        alert(result.message || 'Failed to send OTP');
    }
});

document.getElementById('verifyOtpBtn').addEventListener('click', async function() {
    const otp = document.getElementById('otpInput').value;
    if (!otp) {
        alert('Please enter the OTP.');
        return;
    }
    const response = await fetch('/api/users/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, otp })
    });
    const result = await response.json();
    if (response.ok) {
        alert('Registration successful!');
        window.location.href = '/login';
    } else {
        alert(result.message || 'OTP verification failed');
    }
});
