const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const donationController = require("../controllers/donation.controller");
const userController = require("../controllers/user.controller");

// User donations - requires auth, any authenticated user can view their own
router.get("/donations", authMiddleware, donationController.getUserDonations);

// User profile routes
router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);

module.exports = router;
