'use strict';

const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/cryptoUtils');
const { generateToken, sendTokenCookie } = require('../utils/jwtUtils');
const asyncWrapper = require('../utils/asyncWrapper');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Validate password rules
 */
const validatePassword = (password) => {
  if (!password || password.length < 6) return false;
  return /[A-Z]/.test(password) && /[a-z]/.test(password);
};

/**
 * REGISTER
 */
const register = asyncWrapper(async (req, res) => {
  const { name, email, password, photoUrl } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all fields',
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message:
        'Password must be 6+ chars with uppercase & lowercase letters',
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
  }

  const hashedPassword = hashPassword(password);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    photoUrl: photoUrl || '',
    role: 'user',
  });

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
 * LOGIN
 */
const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  const user = await User.findOne({ email });

  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  const token = generateToken({ id: user._id, role: user.role });
  sendTokenCookie(res, token);

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * LOGOUT
 */
const logout = asyncWrapper(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * ME
 */
const getMe = asyncWrapper(async (req, res) => {
  if (!req.user) {
    return res.status(200).json({ success: false, user: null });
  }

  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

/**
 * 🚀 GOOGLE LOGIN (FIXED VERSION)
 */
const googleLogin = asyncWrapper(async (req, res) => {
  // ✅ FIX: accept "credential" instead of idToken
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({
      success: false,
      message: 'No Google token provided',
    });
  }

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name,
      picture: photoUrl,
    } = payload;

    // Find user
    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.photoUrl && photoUrl) {
          user.photoUrl = photoUrl;
        }
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        photoUrl: photoUrl || '',
        role: 'user',
      });
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    sendTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Google login successful',
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

    return res.status(401).json({
      success: false,
      message: 'Invalid Google token or configuration',
    });
  }
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  googleLogin,
};