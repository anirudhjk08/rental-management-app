const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Transporter is like a configured email client
// We configure it once and reuse it for all emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"Rental App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your OTP Code - Rental Management App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;">
        <h2>Your One-Time Password</h2>
        <p>Use the OTP below to verify your account.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; 
                    text-align: center; padding: 20px; background: #f4f4f4; 
                    border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #888; margin-top: 16px;">
          This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };