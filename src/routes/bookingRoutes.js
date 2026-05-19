'use strict';

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyAuth, requireAuth } = require('../middleware/authMiddleware');

// All booking routes require active token authentication
router.post('/', verifyAuth, requireAuth, bookingController.createBooking);
router.get('/my', verifyAuth, requireAuth, bookingController.getMyBookings);
router.get('/owner', verifyAuth, requireAuth, bookingController.getOwnerBookings);
router.patch('/:id/cancel', verifyAuth, requireAuth, bookingController.cancelBooking);

module.exports = router;
