const nodemailer = require('nodemailer');

// In-memory store for pending registrations: { email: { otp, data, expiresAt } }
const pendingRegistrations = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp, type = 'Registration') {
  // Configure your SMTP settings here
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const subject = type === 'Password Reset' ? 'Your TexosDrinks Password Reset Code' : 'Your TexosDrinks Verification Code';
  const text = type === 'Password Reset' 
    ? `Your password reset code is: ${otp}\n\nIf you did not request a password reset, please ignore this email.`
    : `Your verification code is: ${otp}\n\nThank you for registering with TexosDrinks!`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    text: text,
  });
}

module.exports = { pendingRegistrations, generateOTP, sendOTPEmail };
