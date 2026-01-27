const router = require("express").Router();
const authMiddleware = require("../middlewares/auth.middleware");
const optionalAuthMiddleware = require("../middlewares/optionalAuth.middleware");
const validateObjectId = require("../middlewares/validateObjectId");
const { otpLimiter, mobileOtpLimiter } = require("../middlewares/rateLimit");
const {
  createDonation,
  createDonationOrder,
  getDonationStatus,
  downloadReceipt,
  sendDonationOtp,
  verifyDonationOtp,
} = require("../controllers/donation.controller");

// OTP endpoints for donation verification (rate limited by IP + mobile)
router.post("/send-otp", otpLimiter, mobileOtpLimiter, sendDonationOtp);
router.post("/verify-otp", verifyDonationOtp);

// Donation creation - uses optional auth (works for both guests and logged-in users)
// If user is logged in, donation will be linked to their account
router.post("/create", optionalAuthMiddleware, createDonation);
router.post("/create-order", optionalAuthMiddleware, createDonationOrder);

// NOTE: verify-payment route REMOVED
// Payment confirmation is handled ONLY by Razorpay webhook
// Frontend should poll /:id/status after payment completion

// Public endpoints - no auth required (donationId acts as access token)
router.get("/:id/status", validateObjectId("id"), getDonationStatus);
router.get("/:id/receipt", validateObjectId("id"), downloadReceipt);

module.exports = router;
