const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");
const controller = require("../controllers/nityaAnnadan.public.controller");

// Public endpoints
router.get("/pricing", controller.getPricing);
router.get("/availability", controller.getAvailability);

// Booking creation (Guest or Authenticated Devotee)
router.post("/", optionalAuth, controller.createBooking);

// Razorpay order creation & payment verification (Authenticated)
router.post("/create-order", auth, controller.createRazorpayOrder);
router.post("/verify-payment", auth, controller.verifyPayment);

// User dashboard & history (Authenticated)
router.get("/upcoming", auth, controller.getUpcomingBookings);
router.get("/history", auth, controller.getUserHistory);

module.exports = router;
