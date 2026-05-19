'use strict';

const User = require('../models/User');
const { verifyJwt } = require('../utils/jwtUtils');
const asyncWrapper = require('../utils/asyncWrapper');

/**
 * verifyAuth
 * Global interceptor middleware. Reads JWT from HTTP-only cookie
 * or Authorization headers, decodes it, and attaches the active Mongoose
 * user model to the `req.user` parameter. It does NOT block anonymous requests,
 * allowing subsequent public routes to know the active session.
 */
const verifyAuth = asyncWrapper(async (req, res, next) => {
  let token = null;

  // 1. Try to read from HTTP-only cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization Header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyJwt(token);
    const user = await User.findById(decoded.id).select('-password');
    req.user = user || null;
  } catch (error) {
    req.user = null; // Token invalid/expired
  }

  next();
});

/**
 * requireAuth
 * Route guard that rejects the request with a 401 Unauthorized if
 * the user is not actively logged in.
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to proceed.',
    });
  }
  next();
};

/**
 * requireAdmin
 * Route guard that rejects request with 403 Forbidden if
 * the logged-in user does not have admin privileges.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

module.exports = {
  verifyAuth,
  requireAuth,
  requireAdmin,
};
