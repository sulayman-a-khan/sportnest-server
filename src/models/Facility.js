const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Facility name is required'],
    trim: true,
  },
  facility_type: {
    type: String,
    required: [true, 'Facility type is required'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  price_per_hour: {
    type: Number,
    required: [true, 'Price per hour is required'],
    min: [0, 'Price cannot be negative'],
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    default: 10,
  },
  available_slots: {
    type: [String],
    required: [true, 'Available time slots are required'],
    default: [
      '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00',
      '10:00 - 11:00', '15:00 - 16:00', '16:00 - 17:00',
      '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
      '20:00 - 21:00', '21:00 - 22:00',
    ],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    default: 'A premium sports arena built for professional matches and amateur tournaments.',
  },
  owner_email: {
    type: String,
    required: [true, 'Owner email is required'],
  },
  booking_count: {
    type: Number,
    default: 0,
  },
  // Support high-fidelity UI components and analytics
  rating: {
    type: Number,
    default: 4.5,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  hours: {
    type: String,
    default: '6:00 AM – 11:00 PM',
  },
  tag: {
    type: String,
    default: 'Popular',
  },
  img: {
    type: String,
    required: [true, 'Facility image URL is required'],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for optimal search performance
facilitySchema.index({ name: 'text', location: 'text', facility_type: 'text' });

module.exports = mongoose.model('Facility', facilitySchema);
