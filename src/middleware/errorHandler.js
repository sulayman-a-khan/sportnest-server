'use strict';

/**
 * errorHandler — Centralised Express error-handling middleware.
 *
 * Must be registered LAST with app.use() so it catches errors
 * forwarded by next(err) from any route or middleware.
 *
 * Distinguishes between:
 *  - Operational errors (expected, e.g. validation failure) → specific status code
 *  - Programming errors (unexpected, e.g. undefined variable) → 500
 */
const errorHandler = (err, _req, res, _next) => {
  // Log the full error in development only
  if (process.env.NODE_ENV === 'development') {
    console.error('💥 Error:', err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message    = err.message    || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    // Stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
