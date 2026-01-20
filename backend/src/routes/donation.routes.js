const router = require("express").Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createDonation,
  createDonationOrder,
  getDonationStatus,
  downloadReceipt,
} = require("../controllers/donation.controller");

// Guest-friendly donation creation (auth optional handled in controller)
router.post("/create", createDonation);
router.post("/create-order", createDonationOrder);

// Public endpoints - no auth required (donationId acts as access token)
router.get("/:id/status", getDonationStatus);
router.get("/:id/receipt", downloadReceipt);

module.exports = router;
