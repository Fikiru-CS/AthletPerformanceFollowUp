// server.js – APTS Backend Entry Point
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const os      = require('os');

const authRoutes      = require('./routes/auth');
const sessionsRoutes  = require('./routes/sessions');
const analyticsRoutes = require('./routes/analytics');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Helper: get local IP addresses ───────────────────────────
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4 only, skip internal loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

// ── CORS: allow localhost AND any device on your network ──────
// In development: allow ALL origins so any device can connect.
// In production: list your exact domain(s) instead.
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV === 'production') {
      // Production: only allow the configured frontend URL
      const allowed = (process.env.FRONTEND_URL || '').split(',').map(u => u.trim());
      if (allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    } else {
      // Development: allow everything (any device on your network)
      callback(null, true);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev) ──────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} — from ${ip}`);
    next();
  });
}

// ── Routes ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    ts:     new Date(),
    server: getLocalIPs().map(ip => `http://${ip}:${PORT}`),
  });
});

app.use('/api/auth',      authRoutes);
app.use('/api/sessions',  sessionsRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start: listen on 0.0.0.0 (ALL interfaces) ────────────────
// '0.0.0.0' means the server accepts connections from:
//   - localhost / 127.0.0.1 (same machine)
//   - 192.168.x.x           (other devices on your Wi-Fi)
//   - any other network interface on this machine
app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('\n✅ APTS API is running!\n');
  console.log(`   Local:   http://localhost:${PORT}`);
  ips.forEach(ip => {
    console.log(`   Network: http://${ip}:${PORT}  ← use this on other devices`);
  });
  console.log(`\n   Health:  http://localhost:${PORT}/api/health`);
  console.log('');
});