
const express = require('express');
const router = express.Router();

// ── Public Routes ──────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint', data: req.body });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint', data: req.body });
});

router.post('/forgot-password', (req, res) => {
  res.json({ message: 'Forgot password endpoint', data: req.body });
});

router.post('/reset-password', (req, res) => {
  res.json({ message: 'Reset password endpoint', data: req.body });
});

router.post('/send-otp', (req, res) => {
  res.json({ message: 'Send OTP endpoint', data: req.body });
});

router.post('/verify-otp', (req, res) => {
  res.json({ message: 'Verify OTP endpoint', data: req.body });
});

module.exports = router;
