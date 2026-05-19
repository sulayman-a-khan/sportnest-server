'use strict';

// Force Node.js to use Google's DNS (8.8.8.8) for SRV record lookups.
// This bypasses router/ISP DNS servers that block MongoDB Atlas SRV queries.
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');

/**
 * connectDB
 * Establishes a Mongoose connection to MongoDB Atlas.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4,   // Force IPv4 DNS resolution
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`\n❌  MongoDB connection failed: ${err.message}`);
    console.error(`💡  Tip: Make sure MongoDB is running locally, OR replace`);
    console.error(`    MONGO_URI in .env with your MongoDB Atlas connection string.\n`);
    // Server keeps running — routes that need DB will fail gracefully
  }
};

module.exports = connectDB;
