const router = require("express").Router();
const authMiddleware = require("../middlewares/auth.middleware");
const optionalAuthMiddleware = require("../middlewares/optionalAuth.middleware");
const validateObjectId = require("../middlewares/validateObjectId");
const { donationCreateLimiter } = require("../middlewares/rateLimit");
const {
  createDonation,
  createDonationOrder,
  getDonationStatus,
  downloadReceipt,
  getLeaderboard,
  getMyCollectorStats,
  getLastDonorProfile,
} = require("../controllers/donation.controller");

// Donation creation - uses optional auth (works for both guests and logged-in users)
// If user is logged in, donation will be linked to their account
// Optional referralCode in body for collector attribution
router.post(
  "/create",
  donationCreateLimiter,
  optionalAuthMiddleware,
  createDonation,
);
router.post(
  "/create-order",
  donationCreateLimiter,
  optionalAuthMiddleware,
  createDonationOrder,
);

// Collector/Leaderboard endpoints
router.get("/leaderboard", getLeaderboard); // Public - top collectors
router.get("/my-collector-stats", authMiddleware, getMyCollectorStats); // Requires auth

// Donor profile auto-fill (must be above /:id routes to avoid path collision)
router.get("/me/last-profile", authMiddleware, getLastDonorProfile);

// Public endpoints - no auth required (donationId acts as access token)
router.get("/:id/status", validateObjectId("id"), getDonationStatus);
router.get("/:id/receipt", validateObjectId("id"), downloadReceipt);

module.exports = router;
