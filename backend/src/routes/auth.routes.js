const router = require("express").Router();
const { sendOtp, verifyOtp } = require("../controllers/auth.controller");
const { otpLimiter } = require("../middlewares/rateLimit");

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);

module.exports = router;
