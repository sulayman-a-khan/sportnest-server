'use strict';

const jwt = require('jsonwebtoken');

/**
 * JWT Utilities — placeholder helpers for token generation & verification.
 *
 * These functions will be used by the auth controllers once
 * authentication is implemented.
 *
 * generateToken  — Create a signed JWT for a user
 * verifyJwt      — Verify and decode a JWT string
 */

/**
 * generateToken
 * Creates a signed JWT containing the user's id and role.
 *
 * @param {Object} payload   e.g. { id: user._id, role: user.role }
 * @param {string} expiresIn  e.g. '7d', '1h' (default: '7d')
 * @returns {string} signed JWT
 */
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * verifyJwt
 * Decodes and verifies a JWT string.
 *
 * @param {string} token
 * @returns {Object} decoded payload  —  throws if invalid/expired
 */
const verifyJwt = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * sendTokenCookie
 * Writes the JWT as an HTTP-only cookie for secure auth flow.
 *
 * @param {Object} res    Express response object
 * @param {string} token  Signed JWT
 */
const sendTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,                // not accessible via JavaScript
    secure:   isProduction,        // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

module.exports = { generateToken, verifyJwt, sendTokenCookie };
