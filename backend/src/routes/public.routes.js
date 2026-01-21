const express = require("express");
const router = express.Router();

const {
  getRecentDonations,
  getTopDonors,
} = require("../controllers/public.controller");

/**
 * PUBLIC DONATION ROUTES
 * No authentication required - safe for public consumption
 * Only exposes sanitized, public-safe donation data
 */

// GET /api/public/donations/recent - Last 10 successful donations
router.get("/donations/recent", getRecentDonations);

// GET /api/public/donations/top - Top 5 donors by total amount
router.get("/donations/top", getTopDonors);

module.exports = router;
