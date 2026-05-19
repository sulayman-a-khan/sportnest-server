'use strict';

/**
 * asyncWrapper — Higher-Order Function (HOF) for async route handlers.
 *
 * Eliminates the need to write try/catch in every async controller.
 * Any error thrown inside the wrapped function is automatically
 * forwarded to Express's centralised error handler via next(err).
 *
 * Usage:
 *   router.get('/facilities', asyncWrapper(async (req, res) => {
 *     const facilities = await Facility.find();
 *     res.json({ success: true, data: facilities });
 *   }));
 *
 * @param {Function} fn  Async route handler (req, res, next)
 * @returns {Function}   Wrapped handler that catches promise rejections
 */
const asyncWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncWrapper;
