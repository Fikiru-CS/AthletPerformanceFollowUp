// middleware/validate.js
// Reusable validation helpers using express-validator
const { body, validationResult } = require('express-validator');

// ── Validation Middleware ────────────────────────────────────
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed.',
      fields: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// ── Register Rules ───────────────────────────────────────────
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

// ── Login Rules ──────────────────────────────────────────────
const loginRules = [
  body('email')
    .trim().notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// ── Session Rules ────────────────────────────────────────────
const sessionRules = [
  body('distance_km')
    .isFloat({ min: 0.01 }).withMessage('Distance must be a positive number.'),
  body('duration_minutes')
    .isFloat({ min: 0.1 }).withMessage('Duration must be a positive number.'),
  body('training_date')
    .isDate().withMessage('Training date must be a valid date (YYYY-MM-DD).'),
  body('temperature')
    .optional({ nullable: true })
    .isFloat({ min: -50, max: 60 }).withMessage('Temperature must be between -50 and 60°C.'),
  body('altitude')
    .optional({ nullable: true })
    .isFloat({ min: -500, max: 9000 }).withMessage('Altitude must be between -500 and 9000m.'),
];

// ── Password Reset Rules ─────────────────────────────────────
const forgotPasswordRules = [
  body('email')
    .trim().notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email.')
    .normalizeEmail(),
];

const resetPasswordRules = [
  body('token')
    .notEmpty().withMessage('Reset token is required.'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

// ── Exports ──────────────────────────────────────────────────
module.exports = { 
  validate, 
  registerRules, 
  loginRules, 
  sessionRules,
  forgotPasswordRules,
  resetPasswordRules
};