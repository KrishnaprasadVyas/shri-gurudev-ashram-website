const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");

/**
 * 1. GET /api/finance/audit-logs
 * Paginated query for statutory financial audit logs with multi-field filtering.
 * Role required: TRUSTEE, SYSTEM_ADMIN
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by entity type (e.g., CashAdvance, Voucher, Donation, User)
    if (req.query.entity && req.query.entity !== "ALL") {
      query.entity = req.query.entity.trim();
    }

    // Filter by action type (e.g., ADVANCE_CREATED, ADVANCE_SETTLED)
    if (req.query.action && req.query.action !== "ALL") {
      query.action = req.query.action.trim();
    }

    // Filter by date range on createdAt
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(`${req.query.startDate}T00:00:00.000Z`);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(`${req.query.endDate}T23:59:59.999Z`);
      }
    }

    // Filter by search term (matches entityRef, performedByName, or performedBy role)
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      const regex = new RegExp(searchTerm, "i");
      const searchConditions = [
        { entityRef: regex },
        { performedByName: regex },
        { performedByRole: regex },
        { notes: regex },
        { "financialDetails.referenceNumber": regex },
      ];

      // If search term is a valid ObjectId, allow matching performedBy or entityId directly
      if (mongoose.Types.ObjectId.isValid(searchTerm)) {
        searchConditions.push({ performedBy: new mongoose.Types.ObjectId(searchTerm) });
        searchConditions.push({ entityId: new mongoose.Types.ObjectId(searchTerm) });
      }

      query.$or = searchConditions;
    }

    // Execute paginated query with newest first sort
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          pages,
          limit,
        },
      },
    });
  } catch (err) {
    console.error("Error in getAuditLogs:", err);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving statutory audit trail.",
    });
  }
};

/**
 * 2. GET /api/finance/audit-logs/filters
 * Helper endpoint to retrieve distinct available entities and actions for frontend dropdowns.
 * Role required: TRUSTEE, SYSTEM_ADMIN
 */
exports.getFilterOptions = async (req, res) => {
  try {
    const [actions, entities] = await Promise.all([
      AuditLog.distinct("action"),
      AuditLog.distinct("entity"),
    ]);

    // Ensure standard actions are always present even if database is currently empty
    const defaultActions = [
      "ADVANCE_CREATED",
      "ADVANCE_SETTLED",
      "DIRECT_PAYMENT_CREATED",
      "VOUCHER_CREATED",
      "DONATION_CREATED",
      "ROLE_CHANGED",
    ];
    const defaultEntities = ["CashAdvance", "Voucher", "Donation", "User"];

    const mergedActions = Array.from(new Set([...actions, ...defaultActions])).filter(Boolean).sort();
    const mergedEntities = Array.from(new Set([...entities, ...defaultEntities])).filter(Boolean).sort();

    return res.status(200).json({
      success: true,
      data: {
        actions: mergedActions,
        entities: mergedEntities,
      },
    });
  } catch (err) {
    console.error("Error in getFilterOptions:", err);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving audit filter options.",
    });
  }
};
