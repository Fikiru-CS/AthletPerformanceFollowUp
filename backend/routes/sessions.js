
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// ── Public test route ──────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({ message: 'Sessions route is working!' });
});

// ── Protected Routes ──────────────────────────────────────
router.use(auth);

router.get('/', (req, res) => {
  res.json({ message: 'Get all sessions', user: req.user });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get session by ID', id: req.params.id, user: req.user });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create session', user: req.user, data: req.body });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update session', id: req.params.id, user: req.user, data: req.body });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete session', id: req.params.id, user: req.user });
});

module.exports = router;
