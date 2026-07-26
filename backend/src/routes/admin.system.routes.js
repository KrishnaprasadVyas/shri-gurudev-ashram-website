const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize");
const adminController = require("../controllers/admin.controller");

router.get(
  "/donations",
  auth,
  authorize("SYSTEM_ADMIN", "TRUSTEE"),
  adminController.getAllDonations
);

router.post(
  "/donations/cash",
  auth,
  authorize("SYSTEM_ADMIN", "TRUSTEE"),
  adminController.createCashDonation
);

// Alias: /donations/offline -> same handler (supports CASH, UPI, CHEQUE)
router.post(
  "/donations/offline",
  auth,
  authorize("SYSTEM_ADMIN", "TRUSTEE"),
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

const rateLimit = require("express-rate-limit");
const userManagementController = require("../controllers/userManagement.controller");

const roleChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 role changes per hour per admin
  message: { success: false, message: "Too many role changes attempted from this account. Please try again after an hour." },
  keyGenerator: (req, res) => req.user?.id || "anonymous", // Limit by admin user ID
});

// ==================== ROLE MANAGEMENT (PHASE 7) ====================

router.get(
  "/users",
  auth,
  authorize("SYSTEM_ADMIN"),
  userManagementController.getAllUsers
);

router.patch(
  "/users/:id/role",
  auth,
  authorize("SYSTEM_ADMIN"),
  roleChangeLimiter,
  userManagementController.changeUserRole
);

module.exports = router;
