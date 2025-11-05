const rateLimit = require("express-rate-limit");
const {
  authLimiterConfig,
  downloadLimiterConfig,
  contactLimiterConfig,
} = require("../config/rateLimit.config.js");

const authLimiter = rateLimit({
  ...authLimiterConfig,

  skipSuccessfulRequests: true,

  standardHeaders: true,
  legacyHeaders: false,
});

const downloadLimiter = rateLimit({
  ...downloadLimiterConfig,
  standardHeaders: true,
  legacyHeaders: false,
});

const contactLimiter = rateLimit({
  ...contactLimiterConfig,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, downloadLimiter, contactLimiter };
