const router = require("express").Router();
const {
  sendOtp,
  verifyOtp,
  getMe,
  requestEmailVerification,
  verifyEmail,
  getEmailStatus,
} = require("../controllers/auth.controller");
const {
  otpLimiter,
  emailVerificationLimiter,
} = require("../middlewares/rateLimit");
const authMiddleware = require("../middlewares/auth.middleware");

// Mobile OTP auth
router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/me", authMiddleware, getMe);

// Email verification
// Rate limited: 3 requests per 15 minutes
router.post(
  "/request-email-verification",
  authMiddleware,
  emailVerificationLimiter,
  requestEmailVerification,
);
// Public endpoint - no JWT required (user clicks link from email)
router.get("/verify-email", verifyEmail);
// Check current email status
router.get("/email-status", authMiddleware, getEmailStatus);

module.exports = router;
