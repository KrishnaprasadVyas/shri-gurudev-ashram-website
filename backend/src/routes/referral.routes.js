const express = require("express");
const router = express.Router();
const { validateReferralCode } = require("../services/collector.service");
const { publicApiLimiter } = require("../middlewares/rateLimit");

/**
 * REFERRAL ROUTES
 * Public endpoints for referral code validation
 */

/**
 * Validate referral code
 * GET /api/referral/validate/:code
 * 
 * Returns:
 * - valid: boolean
 * - collectorId: ObjectId (if valid)
 * - collectorName: string (if valid)
 * - error: string (if invalid)
 */
router.get("/validate/:code", publicApiLimiter, async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(200).json({
        valid: false,
        error: "Invalid or inactive referral code",
      });
    }

    const result = await validateReferralCode(code);

    if (!result.valid) {
      return res.status(200).json({
        valid: false,
        error: result.error || "Invalid referral code",
      });
    }

    res.status(200).json({
      valid: true,
      collectorId: result.collectorId,
      collectorName: result.collectorName,
    });
  } catch (error) {
    console.error("Validate referral code error:", error);
    res.status(500).json({
      valid: false,
      error: "Validation failed",
    });
  }
});

module.exports = router;
