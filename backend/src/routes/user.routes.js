const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const donationController = require("../controllers/donation.controller");

// User donations - requires auth, any authenticated user can view their own
router.get("/donations", authMiddleware, donationController.getUserDonations);

module.exports = router;
