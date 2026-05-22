'use strict';

require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const connectDB    = require('./src/config/db');
const apiRoutes    = require('./src/routes/index');
const errorHandler = require('./src/middleware/errorHandler');

// ── App ────────────────────────────────────────────────────
const app  = express();
app.set('trust proxy', 1); // Trust Render's reverse proxy for secure HTTP-only cookies
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow local tools/development or matched origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Body parsers ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Cookie parser ─────────────────────────────────────────
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── 404 handler (unknown routes) ──────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Centralised error handler (MUST be last middleware) ───
app.use(errorHandler);

// ── Connect DB FIRST, then start server ───────────────────
// This prevents Mongoose from buffering the first API request
// and causing a slow initial page load.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀  SportNest Server running on http://localhost:${PORT}`);
    console.log(`📡  API base:  http://localhost:${PORT}/api`);
    console.log(`❤️   Health:   http://localhost:${PORT}/api/health\n`);
  });
});
