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

module.exports = router;
