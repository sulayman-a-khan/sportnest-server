'use strict';

const express = require('express');
const router  = express.Router();

// ── Health-check ──────────────────────────────────────────
/**
 * GET /api/health
 * Simple health-check endpoint to verify the server is up.
 * Used by deployment platforms and uptime monitors.
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status:  'OK',
    message: 'SportNest API is running 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

const facilityRoutes = require('./facilityRoutes');
const bookingRoutes  = require('./bookingRoutes');
const authRoutes     = require('./authRoutes');

router.use('/facilities', facilityRoutes);
router.use('/bookings',   bookingRoutes);
router.use('/auth',       authRoutes);

module.exports = router;
