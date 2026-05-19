'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAuth } = require('../middleware/authMiddleware');

// Public authentication paths
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/logout', authController.logout);

// Session persistence helper (authenticated by verifyAuth middleware)
router.get('/me', verifyAuth, authController.getMe);

module.exports = router;
