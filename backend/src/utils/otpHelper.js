// Generates a random 6-digit OTP as a string
// Math.random() gives 0-1, multiplying by 900000 and adding 100000
// ensures we always get a 6-digit number (100000 to 999999)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Returns a date 10 minutes from now
// This is stored in otp_codes.expires_at
const getOTPExpiry = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
};

module.exports = { generateOTP, getOTPExpiry };