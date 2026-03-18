const rateLimit = require("express-rate-limit");

// Rate limiter for email verification requests
// Allows 3 requests per 15 minutes per IP
exports.emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    message: "Too many email verification requests. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Donation creation rate limiter
 * 10 requests per minute per IP
 * Purpose: Prevent spam/abuse while allowing legitimate donors
 */
exports.donationCreateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: "Too many donation attempts. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Public API rate limiter (referral validation)
 * 30 requests per minute per IP
 * Purpose: Prevent brute-force guessing of referral codes
 */
exports.publicApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Collector application rate limiter
 * 3 requests per hour per IP
 * Purpose: Prevent application spam
 */
exports.collectorApplyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { message: "Too many collector applications. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
