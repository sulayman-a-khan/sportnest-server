'use strict';

const Booking = require('../models/Booking');
const Facility = require('../models/Facility');
const asyncWrapper = require('../utils/asyncWrapper');

/**
 * POST /api/bookings
 * Protected: Create a new facility reservation
 * Prevents double-booking collisions, increments booking_count, and calculates total_price automatically.
 */
const createBooking = asyncWrapper(async (req, res, next) => {
  const { 
    facility_id, 
    facility, 
    booking_date, 
    date, 
    time_slot, 
    timeSlot, 
    hours, 
    duration 
  } = req.body;

  const targetFacilityId = facility_id || facility;
  const targetDate = booking_date || date;
  const targetSlot = time_slot || timeSlot;
  const targetHours = hours || duration;

  if (!targetFacilityId || !targetDate || !targetSlot || !targetHours) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all booking details: facility_id, booking_date, time_slot, hours',
    });
  }

  // 1. Recover facility details to compute price
  const facObj = await Facility.findById(targetFacilityId);
  if (!facObj) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }

  // 2. Validate scheduling conflict (double-booking collision check)
  const existingCollision = await Booking.findOne({
    facility_id: targetFacilityId,
    booking_date: targetDate,
    time_slot: targetSlot,
    status: { $in: ['confirmed', 'pending'] }, // Check active confirmed or pending bookings
  });

  if (existingCollision) {
    return res.status(400).json({
      success: false,
      message: 'Timeslot conflict. This facility is already booked at the requested time.',
    });
  }

  // 3. Compute total price
  const hourlyRate = facObj.price_per_hour || facObj.price;
  const totalPrice = hourlyRate * Number(targetHours);

  // 4. Record booking (strictly adhering to schema properties)
  const booking = await Booking.create({
    facility_id: targetFacilityId,
    user_email: req.user.email,
    user: req.user._id,
    booking_date: targetDate,
    time_slot: targetSlot,
    hours: Number(targetHours),
    total_price: totalPrice,
    status: 'pending', // Default is "pending" as required!
  });

  // 5. Increment facility booking_count using $inc
  await Facility.updateOne({ _id: facObj._id }, { $inc: { booking_count: 1 } });

  const populated = await booking.populate('facility_id');

  return res.status(201).json({
    success: true,
    message: 'Booking completed successfully! Please wait for owner confirmation.',
    data: populated,
  });
});

/**
 * GET /api/bookings/my
 * Protected: Fetch bookings made by the logged-in user
 */
const getMyBookings = asyncWrapper(async (req, res, next) => {
  const bookings = await Booking.find({
    $or: [
      { user_email: req.user.email },
      { user: req.user._id }
    ]
  })
  .populate('facility_id')
  .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

/**
 * GET /api/bookings/owner
 * Protected: Retrieve bookings made on facilities owned by the logged-in user
 * Uses $in operator to match bookings against all owned facilities
 */
const getOwnerBookings = asyncWrapper(async (req, res, next) => {
  // 1. Recover facilities owned by user
  const myFacilities = await Facility.find({
    $or: [
      { owner_email: req.user.email },
      { owner: req.user._id }
    ]
  });
  const facilityIds = myFacilities.map((f) => f._id);

  // 2. Query bookings of those facilities
  const bookings = await Booking.find({
    facility_id: { $in: facilityIds }
  })
  .populate('facility_id')
  .populate('user', 'name email')
  .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

/**
 * PATCH /api/bookings/:id/cancel
 * Protected: Cancel an active reservation
 * Security check: Can only be cancelled by the user who booked it OR the facility owner
 */
const cancelBooking = asyncWrapper(async (req, res, next) => {
  console.log(`\n▶️ Cancel Request Received for Booking ID: ${req.params.id}`);
  
  const booking = await Booking.findById(req.params.id).populate('facility_id');
  
  if (!booking) {
    console.log('❌ Booking not found in DB.');
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (booking.status === 'cancelled') {
    console.log('⚠️ Booking is already cancelled.');
    return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
  }

  const activeFac = booking.facility_id; // Try to use the populated document
  const isRenter = booking.user_email === req.user.email || (booking.user && booking.user.toString() === req.user._id.toString());
  
  let isFacilityOwner = false;
  if (activeFac && typeof activeFac === 'object') {
    isFacilityOwner = activeFac.owner_email === req.user.email || (activeFac.owner && activeFac.owner.toString() === req.user._id.toString());
  }

  console.log(`👤 User Email: ${req.user.email}, Role: ${req.user.role}`);
  console.log(`🔒 isRenter: ${isRenter}, isFacilityOwner: ${isFacilityOwner}`);

  // Cancel restriction check
  if (!isRenter && !isFacilityOwner && req.user.role !== 'admin') {
    console.log('❌ Access Denied: User is neither renter, owner, nor admin.');
    return res.status(403).json({
      success: false,
      message: 'Access Denied. You are not authorized to cancel this booking.',
    });
  }

  console.log('✅ Access granted. Proceeding to update status...');
  booking.status = 'cancelled';
  
  try {
    await booking.save();
    console.log('✅ Booking status updated successfully.');
  } catch (saveErr) {
    console.error('💥 Error saving booking:', saveErr);
    return res.status(500).json({ success: false, message: 'Database validation failed while cancelling. Please contact support.' });
  }

  // Decrement facility booking count only if activeFac is a valid populated document
  if (activeFac && typeof activeFac.save === 'function') {
    console.log('📉 Decrementing facility booking count...');
    try {
      await Facility.updateOne(
        { _id: activeFac._id, booking_count: { $gt: 0 } },
        { $inc: { booking_count: -1 } }
      );
      console.log('✅ Facility booking count decremented.');
    } catch (facSaveErr) {
      console.error('💥 Error saving facility:', facSaveErr);
    }
  } else {
    console.log('⚠️ Could not decrement facility count (Facility not populated or missing).');
  }

  return res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: booking,
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  cancelBooking,
};
