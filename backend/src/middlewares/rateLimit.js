const rateLimit = require("express-rate-limit");

exports.otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Too many OTP requests. Try again later.",
});
