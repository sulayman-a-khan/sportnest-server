'use strict';

/**
 * controllers/
 *
 * Place all route controller functions here.
 * Each file corresponds to a resource / feature domain.
 *
 * Planned controllers:
 *  facilityController.js  — getAllFacilities, getFacilityById, etc.
 *  bookingController.js   — createBooking, getUserBookings, etc.
 *  userController.js      — getUserProfile, updateProfile, etc.
 *  authController.js      — register, login, logout, etc.
 *
 * Controller pattern:
 *   const { asyncWrapper } = require('../utils/asyncWrapper');
 *
 *   exports.getAllFacilities = asyncWrapper(async (req, res) => {
 *     // business logic here
 *     res.json({ success: true, data: [] });
 *   });
 */
