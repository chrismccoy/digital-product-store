const rateLimit = require("express-rate-limit");
const { authLimiterConfig } = require("../config/rateLimit.config.js");

/**
 * Rate limiter for authentication route.
 * It uses settings from the central config file and is configured to:
 *  - Only count failed requests (e.g., wrong password).
 *  - Use modern `RateLimit-*` standard headers.
 */
const authLimiter = rateLimit({
  ...authLimiterConfig,

  // Only penalize users for failed attempts. Successful logins do not count.
  skipSuccessfulRequests: true,

  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter };
