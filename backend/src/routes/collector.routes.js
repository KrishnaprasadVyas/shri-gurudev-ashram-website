const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize");
const { collectorApplyLimiter } = require("../middlewares/rateLimit");
const {
  uploadKycDocuments,
  handleKycUploadError,
} = require("../middlewares/kyc.middleware");
const collectorController = require("../controllers/collector.controller");

/**
 * COLLECTOR ROUTES
 * Handles collector KYC application and dashboard endpoints
 * All routes require authentication
 */

// Apply for collector role
// POST /api/collector/apply
router.post(
  "/apply",
  collectorApplyLimiter,
  auth,
  uploadKycDocuments,
  handleKycUploadError,
  collectorController.applyForCollector
);

// Get current application status
// GET /api/collector/status
router.get(
  "/status",
  auth,
  collectorController.getApplicationStatus
);

// Reapply after rejection
// POST /api/collector/reapply
router.post(
  "/reapply",
  auth,
  uploadKycDocuments,
  handleKycUploadError,
  collectorController.reapplyForCollector
);

// Get collector dashboard (approved collectors only)
// GET /api/collector/dashboard
router.get(
  "/dashboard",
  auth,
  authorize("COLLECTOR_APPROVED"),
  collectorController.getDashboard
);

module.exports = router;
