const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (toEmail, otp) => {
  await resend.emails.send({
    from: 'Rental App <onboarding@resend.dev>',
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
          This OTP expires in <strong>10 minutes</strong>.
        </p>
      </div>
    `,
  });
};

const sendNotificationEmail = async (toEmail, subject, htmlBody) => {
  await resend.emails.send({
    from: 'Rental App <onboarding@resend.dev>',
    to: toEmail,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        ${htmlBody}
        <hr style="margin-top: 30px;"/>
        <p style="color: #888; font-size: 12px;">
          This is an automated notification from Rental Management App.
        </p>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail, sendNotificationEmail };