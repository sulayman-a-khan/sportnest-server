const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  facility_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: [true, 'Facility ID is required'],
  },
  user_email: {
    type: String,
    required: [true, 'User email is required'],
  },
  booking_date: {
    type: String, // format YYYY-MM-DD
    required: [true, 'Booking date is required'],
  },
  time_slot: {
    type: String,
    required: [true, 'Time slot is required'],
  },
  hours: {
    type: Number,
    required: [true, 'Duration hours are required'],
    min: [1, 'Minimum duration is 1 hour'],
  },
  total_price: {
    type: Number,
    required: [true, 'Total price is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  // Support UI relationships and user details
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);
