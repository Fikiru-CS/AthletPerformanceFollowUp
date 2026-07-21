// controllers/authController.js
const { sendOTPEmail } = require('../utils/email');

// ── Update the sendOTP function ──────────────────────────────────
async function sendOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Check if email already registered
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(email, { otp, expiresAt, attempts: 0 });

    // Log OTP for development
    console.log(`📧 OTP for ${email}: ${otp}`);
    console.log(`⏰ OTP expires in 5 minutes`);

    // ── SEND ACTUAL EMAIL ──────────────────────────────────────
    try {
      // Send OTP via email
      await sendOTPEmail(email, otp, 'User');
      console.log(`✅ OTP email sent successfully to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Don't fail the request if email fails, just return the OTP in dev
      if (process.env.NODE_ENV === 'development') {
        return res.json({
          message: 'OTP generated (email failed)',
          otp,
          email,
          warning: 'Email sending failed. Check your email configuration.'
        });
      }
      return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
    }

    // In development, also return the OTP for testing
    if (process.env.NODE_ENV === 'development') {
      return res.json({ 
        message: 'OTP sent successfully to your email.',
        otp, // Only in development
        email
      });
    }

    res.json({ 
      message: 'OTP sent successfully. Please check your email.'
    });

  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
}
const { sendResetEmail } = require('../utils/email');

// ── Update the forgotPassword function ──────────────────────────
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(200).json({
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    const user = userResult.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await pool.query(
      `INSERT INTO password_resets (user_id, reset_token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    console.log('🔑 Password reset link:', resetLink);
    console.log('📧 For user:', user.email);

    // ── SEND PASSWORD RESET EMAIL ──────────────────────────────
    try {
      await sendResetEmail(user.email, user.name, resetLink);
      console.log(`✅ Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      // Continue anyway - we'll return the link in development
    }

    if (process.env.NODE_ENV === 'development') {
      return res.json({
        message: 'Password reset link generated successfully.',
        resetToken,
        resetLink,
        userEmail: user.email
      });
    }

    res.status(200).json({
      message: 'If an account exists with this email, you will receive a password reset link.'
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
}
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const pool   = require('../db/pool');

// ── Helper ──────────────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── POST /api/auth/register ──────────────────────────────────
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Check duplicate email
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hashed]
    );

    const user  = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
}

// ── POST /api/auth/login ─────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user  = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { password: _pw, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

// ── GET /api/auth/me ─────────────────────────────────────────
async function getMe(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar_url, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// ── PUT /api/auth/profile ────────────────────────────────────
async function updateProfile(req, res) {
  try {
    const { name, bio } = req.body;
    const result = await pool.query(
      `UPDATE users SET name=$1, bio=$2 WHERE id=$3
       RETURNING id, name, email, avatar_url, bio, created_at`,
      [name, bio, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// ── POST /api/auth/forgot-password ──────────────────────────
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(200).json({
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    const user = userResult.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await pool.query(
      `INSERT INTO password_resets (user_id, reset_token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    console.log('🔑 Password reset link:', resetLink);
    console.log('📧 For user:', user.email);

    if (process.env.NODE_ENV === 'development') {
      return res.json({
        message: 'Password reset link generated successfully.',
        resetToken,
        resetLink,
        userEmail: user.email
      });
    }

    res.status(200).json({
      message: 'If an account exists with this email, you will receive a password reset link.'
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
}

// ── POST /api/auth/reset-password ───────────────────────────
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const tokenResult = await pool.query(
      `SELECT pr.*, u.id as user_id, u.email 
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.reset_token = $1 
         AND pr.is_used = FALSE 
         AND pr.expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token. Please request a new one.' 
      });
    }

    const resetData = tokenResult.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, resetData.user_id]
    );

    await pool.query(
      'UPDATE password_resets SET is_used = TRUE WHERE id = $1',
      [resetData.id]
    );

    res.json({
      message: 'Password reset successfully! You can now login with your new password.'
    });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
}

// ── GET /api/auth/validate-reset-token/:token ───────────────
async function validateResetToken(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token is required.' });
    }

    const result = await pool.query(
      `SELECT id, expires_at 
       FROM password_resets 
       WHERE reset_token = $1 
         AND is_used = FALSE 
         AND expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid or expired reset token.' 
      });
    }

    res.json({ 
      valid: true,
      expires_at: result.rows[0].expires_at
    });

  } catch (err) {
    console.error('Validate token error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// ── POST /api/auth/logout ────────────────────────────────────
async function logout(req, res) {
  res.json({ message: 'Logged out successfully.' });
}

// ── OTP Store ──────────────────────────────────────────────────
const otpStore = new Map();

// ── Generate OTP ──────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random()  * 900000).toString();
}

// ── POST /api/auth/send-otp ──────────────────────────────────
async function sendOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(email, { otp, expiresAt, attempts: 0 });

    console.log(`📧 OTP for ${email}: ${otp}`);
    console.log(`⏰ OTP expires in 5 minutes`);

    if (process.env.NODE_ENV === 'development') {
      return res.json({ 
        message: 'OTP sent successfully.',
        otp,
        email
      });
    }

    res.json({ 
      message: 'OTP sent successfully. Please check your email.'
    });

  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
}

// ── POST /api/auth/verify-otp ─────────────────────────────────
async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    if (storedData.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      otpStore.set(email, storedData);
      const remainingAttempts = 3 - storedData.attempts;
      return res.status(400).json({ 
        error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.` 
      });
    }

    otpStore.delete(email);

    res.json({ 
      message: 'OTP verified successfully.',
      verified: true
    });

  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
}

// ── Clean up expired OTPs periodically ──────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 10 * 60 * 1000);

module.exports = { 
  register, 
  login, 
  getMe, 
  updateProfile,
  forgotPassword,
  resetPassword,
  validateResetToken,
  logout,
  sendOTP,
  verifyOTP
};