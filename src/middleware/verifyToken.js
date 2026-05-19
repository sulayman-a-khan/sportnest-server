'use strict';

const jwt = require('jsonwebtoken');

/**
 * verifyToken — Protected route middleware placeholder.
 *
 * When authentication is implemented, this middleware will:
 *  1. Read the JWT from cookies or the Authorization header
 *  2. Verify it with JWT_SECRET
 *  3. Attach the decoded user payload to req.user
 *  4. Call next() to continue to the route handler
 *
 * For now it returns 501 Not Implemented so private routes
 * are clearly marked as unfinished during development.
 *
 * Usage:
 *   router.get('/dashboard', verifyToken, dashboardController);
 */
const verifyToken = (req, res, next) => {
  // ── TODO: implement when auth is ready ────────────────────
  // const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  //
  // if (!token) {
  //   return res.status(401).json({ success: false, message: 'Unauthorised — no token' });
  // }
  //
  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   req.user = decoded;
  //   next();
  // } catch {
  //   res.status(401).json({ success: false, message: 'Unauthorised — invalid token' });
  // }
  // ──────────────────────────────────────────────────────────

  return res.status(501).json({
    success: false,
    message: 'Authentication not implemented yet.',
  });
};

module.exports = verifyToken;
