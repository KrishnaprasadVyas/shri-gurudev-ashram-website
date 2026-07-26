const express = require("express");
const router = express.Router();
const financeReportsController = require("../controllers/finance.reports.controller");

/**
 * Finance Reports Routes (Phase 5)
 * Mounted at /api/finance/reports in finance.routes.js
 * Inherits auth, authorize("TRUSTEE", "SYSTEM_ADMIN"), and rate limiting.
 */
router.get("/cash-book", financeReportsController.getCashBook);
router.get("/voucher-register", financeReportsController.getVoucherRegister);
router.get("/outstanding-advances", financeReportsController.getOutstandingAdvances);
router.get("/monthly-summary", financeReportsController.getMonthlySummary);
router.get("/annual-export", financeReportsController.getAnnualExport);
router.get("/dashboard-stats", financeReportsController.getDashboardStats);

module.exports = router;
