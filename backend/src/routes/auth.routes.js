const router = require("express").Router();
const {
  verifyFirebaseToken,
  getMe,
  requestEmailVerification,
  verifyEmail,
  getEmailStatus,
} = require("../controllers/auth.controller");
const { emailVerificationLimiter } = require("../middlewares/rateLimit");
const authMiddleware = require("../middlewares/auth.middleware");

// Firebase Phone Authentication
router.post("/verify-firebase-token", verifyFirebaseToken);
router.get("/me", authMiddleware, getMe);

// Email verification
// Rate limited: 3 requests per 15 minutes
router.post(
  "/request-email-verification",
  authMiddleware,
  emailVerificationLimiter,
  requestEmailVerification,
);
// Public endpoint - no JWT required (user clicks link from email)
router.get("/verify-email", verifyEmail);
// Check current email status
router.get("/email-status", authMiddleware, getEmailStatus);

module.exports = router;
