/**
 * A central place for managing rate limit configurations.
 */

const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;

const authLimiterConfig = {
  // The time window in milliseconds.
  windowMs:
    parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) ||
    FIFTEEN_MINUTES_IN_MS,

  // The maximum number of requests to allow per windowMs.
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,

  // A message and error code to be returned when the limit is exceeded.
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },

  statusCode: 429,
};

module.exports = { authLimiterConfig };
