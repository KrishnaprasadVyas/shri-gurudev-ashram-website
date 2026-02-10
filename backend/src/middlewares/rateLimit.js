const rateLimit = require("express-rate-limit");

/**
 * IP-based OTP rate limiter
 * 5 requests per 5 minutes per IP
 */
exports.otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { message: "Too many OTP requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Per-mobile OTP rate limiter using in-memory store
 * Prevents abuse even from multiple IPs targeting same mobile
 * 3 requests per 5 minutes per mobile number
 */
const mobileOtpStore = new Map();

const cleanupMobileStore = () => {
  const now = Date.now();
  for (const [mobile, data] of mobileOtpStore.entries()) {
    if (now > data.resetTime) {
      mobileOtpStore.delete(mobile);
    }
  }
};

// Cleanup every 5 minutes
setInterval(cleanupMobileStore, 5 * 60 * 1000);

exports.mobileOtpLimiter = (req, res, next) => {
  const mobile = req.body?.mobile;
  
  if (!mobile) {
    return next(); // Let controller handle missing mobile
  }
  
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxRequests = 3;
  
  let record = mobileOtpStore.get(mobile);
  
  if (!record || now > record.resetTime) {
    // Create new record
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    mobileOtpStore.set(mobile, record);
    return next();
  }
  
  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.set("Retry-After", retryAfter);
    return res.status(429).json({
      message: "Too many OTP requests for this mobile number. Try again later.",
      retryAfter: retryAfter,
    });
  }
  
  record.count++;
  next();
};

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
 * FIX 1: Donation creation rate limiter
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
 * FIX 2: Public API rate limiter (referral validation)
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
