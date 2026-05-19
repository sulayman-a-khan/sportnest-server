'use strict';

const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/cryptoUtils');
const { generateToken, sendTokenCookie } = require('../utils/jwtUtils');
const asyncWrapper = require('../utils/asyncWrapper');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Validates password rules:
 * - Minimum 6 characters
 * - One uppercase letter
 * - One lowercase letter
 */
const validatePassword = (password) => {
  if (!password || password.length < 6) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  return hasUpper && hasLower;
};

/**
 * POST /api/auth/register
 * Register a new user in the database
 */
const register = asyncWrapper(async (req, res, next) => {
  const { name, email, password, photoUrl } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all fields' });
  }

  // Password validation checks
  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters, and contain at least one uppercase and one lowercase letter.',
    });
  }

  // Check unique email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email is already registered' });
  }

  // Hash password using native pbkdf2 helper
  const hashedPassword = hashPassword(password);

  // Create user with optional photoUrl
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    photoUrl: photoUrl || '',
    role: 'user', // Default role
  });

  // Generate JWT and set HTTP-only cookie
  const token = generateToken({ id: user._id, role: user.role });
  sendTokenCookie(res, token);

  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      role: user.role,
    },
  });
});

/**
 * POST /api/auth/login
 * Log in an existing user
 */
const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Verify PBKDF2 password hash
  const isMatch = verifyPassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Generate JWT and set HTTP-only cookie
  const token = generateToken({ id: user._id, role: user.role });
  sendTokenCookie(res, token);

  return res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * POST /api/auth/logout
 * Log out user by clearing cookie
 */
const logout = asyncWrapper(async (req, res, next) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Persistent session recovery for loaded/reloaded states
 */
const getMe = asyncWrapper(async (req, res, next) => {
  if (!req.user) {
    return res.status(200).json({ success: false, user: null });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      photoUrl: req.user.photoUrl || '',
      role: req.user.role,
    },
  });
});

/**
 * POST /api/auth/google
 * Log in or register a user via Google OAuth
 */
const googleLogin = asyncWrapper(async (req, res, next) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'No Google token provided' });
  }

  try {
    // Verify token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: photoUrl } = payload;

    // Check if user exists by email or googleId
    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (user) {
      // If user exists but doesn't have googleId attached yet (e.g. they registered via email first), attach it
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.photoUrl && photoUrl) user.photoUrl = photoUrl;
        await user.save();
      }
    } else {
      // Create new user without password
      user = await User.create({
        name,
        email,
        googleId,
        photoUrl: photoUrl || '',
        role: 'user',
      });
    }

    // Generate JWT and set HTTP-only cookie
    const token = generateToken({ id: user._id, role: user.role });
    sendTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Google Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    return res.status(401).json({ success: false, message: 'Invalid Google token or configuration.' });
  }
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  googleLogin,
};
