'use strict';

const Facility = require('../models/Facility');
const asyncWrapper = require('../utils/asyncWrapper');

/**
 * GET /api/facilities
 * Public Search & Filter API
 * Supports:
 * - search: string (matches name, location, or facility_type via case-insensitive regex)
 * - sport / facility_type: string (comma-separated list, matches using $in)
 * - minPrice / maxPrice: number (matches price_per_hour via $gte / $lte)
 * - rating: number (matches rating via $gte)
 */
const getAllFacilities = asyncWrapper(async (req, res, next) => {
  const { search, sport, facility_type, minPrice, maxPrice, rating } = req.query;
  const mongoQuery = {};

  // 1. Regex search on name, location or type
  if (search) {
    mongoQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { facility_type: { $regex: search, $options: 'i' } },
    ];
  }

  // 2. $in filter for sports categories
  const activeType = sport || facility_type;
  if (activeType) {
    const typesArray = activeType.split(',').map(s => s.trim());
    mongoQuery.facility_type = { $in: typesArray };
  }

  // 3. Price range filtering
  if (minPrice || maxPrice) {
    mongoQuery.price_per_hour = {};
    if (minPrice) mongoQuery.price_per_hour.$gte = Number(minPrice);
    if (maxPrice) mongoQuery.price_per_hour.$lte = Number(maxPrice);
  }

  // 4. Rating threshold filtering
  if (rating) {
    mongoQuery.rating = { $gte: Number(rating) };
  }

  const facilities = await Facility.find(mongoQuery).populate('owner', 'name email');

  return res.status(200).json({
    success: true,
    count: facilities.length,
    data: facilities,
  });
});

/**
 * GET /api/facilities/:id
 * Retrieve details of a single facility along with its active bookings
 */
const getFacilityById = asyncWrapper(async (req, res, next) => {
  const facility = await Facility.findById(req.params.id).populate('owner', 'name email');

  if (!facility) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }

  const Booking = require('../models/Booking');
  const bookings = await Booking.find({
    $or: [{ facility_id: facility._id }, { facility: facility._id }],
    status: { $in: ['pending', 'confirmed'] }
  }).select('booking_date date time_slot timeSlot hours duration status');

  return res.status(200).json({
    success: true,
    data: facility,
    bookings,
  });
});

/**
 * POST /api/facilities
 * Protected: Create a new sports facility
 */
const createFacility = asyncWrapper(async (req, res, next) => {
  const { 
    name, 
    facility_type, 
    sport, 
    location, 
    price_per_hour, 
    price, 
    capacity, 
    available_slots, 
    description, 
    img, 
    hours, 
    tag 
  } = req.body;

  const targetType = facility_type || sport;
  const targetPrice = price_per_hour || price;

  if (!name || !targetType || !location || !targetPrice || !img || !description) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: name, facility_type, location, price_per_hour, img, description',
    });
  }

  const facility = await Facility.create({
    name,
    facility_type: targetType,
    location,
    price_per_hour: Number(targetPrice),
    capacity: Number(capacity || 10),
    available_slots: available_slots || [
      '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00',
      '10:00 - 11:00', '15:00 - 16:00', '16:00 - 17:00',
      '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
      '20:00 - 21:00', '21:00 - 22:00',
    ],
    description: description || 'Premium sports arena built for professional matches and amateur tournaments.',
    owner_email: req.user.email, // Auto-filled from user session email!
    hours: hours || '6:00 AM – 11:00 PM',
    img,
    tag: tag || 'Popular',
    owner: req.user._id, // Active logged-in user is the owner
  });

  return res.status(201).json({
    success: true,
    message: 'Facility created successfully',
    data: facility,
  });
});

/**
 * PUT /api/facilities/:id
 * Protected: Update details of an owned facility
 * Owner-only protection
 */
const updateFacility = asyncWrapper(async (req, res, next) => {
  let facility = await Facility.findById(req.params.id);

  if (!facility) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }

  // Owner-only update protection check
  if (facility.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied. You are not the owner of this facility.',
    });
  }

  // Ensure body edits translate correctly for backward compatibility
  const updates = { ...req.body };
  if (updates.sport && !updates.facility_type) updates.facility_type = updates.sport;
  if (updates.price && !updates.price_per_hour) updates.price_per_hour = updates.price;

  facility = await Facility.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    message: 'Facility updated successfully',
    data: facility,
  });
});

/**
 * DELETE /api/facilities/:id
 * Protected: Delete an owned facility
 * Owner-only protection
 */
const deleteFacility = asyncWrapper(async (req, res, next) => {
  const facility = await Facility.findById(req.params.id);

  if (!facility) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }

  // Owner-only delete protection check
  if (facility.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied. You are not the owner of this facility.',
    });
  }

  await facility.deleteOne();

  return res.status(200).json({
    success: true,
    message: 'Facility removed successfully',
  });
});

module.exports = {
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
};
