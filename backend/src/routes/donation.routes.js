const router = require("express").Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createDonation,
  createDonationOrder,
} = require("../controllers/donation.controller");

router.post("/create", authMiddleware, createDonation);
router.post("/create-order", authMiddleware, createDonationOrder);

module.exports = router;
