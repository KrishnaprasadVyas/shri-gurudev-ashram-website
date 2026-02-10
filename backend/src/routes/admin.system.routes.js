const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize");
const adminController = require("../controllers/admin.controller");

router.get(
  "/donations",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.getAllDonations
);

router.post(
  "/donations/cash",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.createCashDonation
);

router.get(
  "/donors",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.getAllDonors
);

router.get(
  "/reports",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.getReports
);

// Collector management routes (Admin only)
router.get(
  "/collectors/summary",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.getCollectorSummary
);

router.get(
  "/collectors",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.getAllCollectors
);

router.get(
  "/collectors/:id",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.getCollectorDetails
);

router.patch(
  "/collectors/:id/toggle-status",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.toggleCollectorStatus
);

// ==================== COLLECTOR KYC MANAGEMENT ====================

// Get all collector applications (pending, approved, rejected, or all)
router.get(
  "/collector-applications",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.getCollectorApplications
);

// Approve a collector application
router.post(
  "/collector/:userId/approve",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.approveCollectorApplication
);

// Reject a collector application
router.post(
  "/collector/:userId/reject",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.rejectCollectorApplication
);

// View KYC document (secure streaming - admin only)
router.get(
  "/collector/:userId/kyc/:type",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.viewKycDocument
);

// Revoke an approved collector's status
router.post(
  "/collector/:userId/revoke",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.revokeCollectorStatus
);

module.exports = router;
