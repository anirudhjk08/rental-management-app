const express = require('express');
const router = express.Router();
const { register, login, verifyOTP } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOTP);

module.exports = router;