const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize");
const donationController = require("../controllers/donation.controller");

router.get(
  "/donations",
  authMiddleware,
  authorize("USER"),
  donationController.getUserDonations
);

module.exports = router;
