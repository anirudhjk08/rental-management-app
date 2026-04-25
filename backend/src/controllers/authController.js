const pool = require('../db/index');
const { generateOTP, getOTPExpiry } = require('../utils/otpHelper');
const { sendOTPEmail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────
// REGISTER
// Flow: receive email+name → create user → send OTP
// ─────────────────────────────────────────
const register = async (req, res) => {
  const { email, name, phone } = req.body;

  // Basic validation
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  try {
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered. Please login instead.' });
    }

    // Create the user
    const newUser = await pool.query(
      'INSERT INTO users (email, name, phone) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, name, phone]
    );

    const user = newUser.rows[0];

    // Generate OTP and save to DB
    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    await pool.query(
      'INSERT INTO otp_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
      [user.id, otp, expiresAt]
    );

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: 'Registration successful. OTP sent to your email.',
      userId: user.id,
    });

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// LOGIN
// Flow: receive email → check user exists → send OTP
// ─────────────────────────────────────────
const login = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Email not registered. Please register first.' });
    }

    const user = userResult.rows[0];

    // Invalidate any previous unused OTPs for this user
    await pool.query(
      'UPDATE otp_codes SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE',
      [user.id]
    );

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    await pool.query(
      'INSERT INTO otp_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
      [user.id, otp, expiresAt]
    );

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      message: 'OTP sent to your email.',
      userId: user.id,
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// VERIFY OTP
// Flow: receive userId+otp → validate → return JWT
// ─────────────────────────────────────────
const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ error: 'userId and otp are required' });
  }

  try {
    // Find the most recent unused OTP for this user
    const otpResult = await pool.query(
      `SELECT * FROM otp_codes 
       WHERE user_id = $1 AND is_used = FALSE 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No valid OTP found. Please request a new one.' });
    }

    const otpRecord = otpResult.rows[0];

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check if OTP matches
    if (otpRecord.code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    // Mark OTP as used
    await pool.query(
      'UPDATE otp_codes SET is_used = TRUE WHERE id = $1',
      [otpRecord.id]
    );

    // Get user details
    const userResult = await pool.query(
      'SELECT id, email, name, phone FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    // Generate JWT token
    // This token contains the userId and expires in 7 days
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'OTP verified successfully.',
      token,
      user,
    });

  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login, verifyOTP };