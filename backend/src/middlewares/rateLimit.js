const rateLimit = require("express-rate-limit");

exports.otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Too many OTP requests. Try again later.",
});

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
