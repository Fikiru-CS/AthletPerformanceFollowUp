
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// ── Public test route ──────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({ message: 'Analytics route is working!' });
});

// ── Protected Routes ──────────────────────────────────────
router.use(auth);

router.get('/summary', (req, res) => {
  res.json({ 
    message: 'Analytics summary',
    user: req.user,
    data: {
      total_sessions: 0,
      total_distance: 0,
      avg_speed: 0,
      best_pace: 0,
      longest_run: 0,
      fastest_speed: 0
    }
  });
});

router.get('/trends', (req, res) => {
  res.json({
    message: 'Analytics trends',
    user: req.user,
    daily: [],
    weekly: [],
    top5: []
  });
});

module.exports = router;
