/**
 * A central place for managing rate limit configurations.
 */

const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;

const authLimiterConfig = {
  windowMs:
    parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) ||
    FIFTEEN_MINUTES_IN_MS,

  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,

  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },

  statusCode: 429,
};

const downloadLimiterConfig = {
  windowMs:
    parseInt(process.env.DOWNLOAD_RATE_LIMIT_WINDOW_MS) ||
    FIFTEEN_MINUTES_IN_MS,

  max: parseInt(process.env.DOWNLOAD_RATE_LIMIT_MAX) || 10,

  message: {
    success: false,
    message: "Too many download requests. Please try again later.",
  },

  statusCode: 429,
};

const contactLimiterConfig = {
  windowMs:
    parseInt(process.env.CONTACT_RATE_LIMIT_WINDOW_MS) ||
    FIFTEEN_MINUTES_IN_MS,

  max: parseInt(process.env.CONTACT_RATE_LIMIT_MAX) || 5,

  message: {
    success: false,
    message: "Too many messages sent. Please try again later.",
  },

  statusCode: 429,
};

module.exports = {
  authLimiterConfig,
  downloadLimiterConfig,
  contactLimiterConfig,
};
