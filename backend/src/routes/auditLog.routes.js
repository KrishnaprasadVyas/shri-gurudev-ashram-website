const express = require("express");
const router = express.Router();
const auditLogController = require("../controllers/auditLog.controller");

/**
 * Statutory Audit Trail Routes
 * Mounted at: /api/finance/audit-logs
 * Inherits authentication, role authorization (TRUSTEE, SYSTEM_ADMIN), and rate limiting from finance.routes.js
 *
 * CRITICAL DESIGN RULE:
 * This router exposes ONLY read-only GET endpoints. No modification or deletion routes exist.
 */

// GET /api/finance/audit-logs/filters — Get available entity and action filter dropdown values
router.get("/filters", auditLogController.getFilterOptions);

// GET /api/finance/audit-logs — Get paginated and filtered audit logs
router.get("/", auditLogController.getAuditLogs);

module.exports = router;
