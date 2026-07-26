const mongoose = require("mongoose");
const { mainDb } = require("../config/db");

/**
 * AuditLog Schema
 * ERP Phase 1 — Persistent financial audit trail
 *
 * CRITICAL DESIGN RULES:
 * 1. This collection is APPEND-ONLY. No updates, no deletes — ever.
 * 2. Every financial operation (advance, settlement, voucher, donation, role change)
 *    must create an entry here.
 * 3. The `financialDetails` sub-document captures a monetary snapshot for reporting.
 * 4. The `changes` sub-document captures before/after state for edit operations.
 *
 * Controller enforcement: never expose PUT/DELETE routes for this collection.
 */
const auditLogSchema = new mongoose.Schema(
  {
    // ─── What happened ────────────────────────────────────────────────────────
    /**
     * Machine-readable action identifier.
     * Convention: ENTITY_VERB (e.g., ADVANCE_CREATED, ADVANCE_SETTLED, ROLE_CHANGED)
     */
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
      index: true,
    },

    /**
     * The Mongoose model name of the affected document.
     * E.g., "CashAdvance", "Voucher", "Donation", "User"
     */
    entity: {
      type: String,
      required: [true, "Entity name is required"],
      trim: true,
      index: true,
    },

    /**
     * MongoDB ObjectId of the affected document.
     */
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Entity ID is required"],
      index: true,
    },

    /**
     * Human-readable reference number for the affected document.
     * E.g., "ADV-000001", "VCH-000001", "CA-000001"
     * Stored as a snapshot so the log remains readable even if source data changes.
     */
    entityRef: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Who did it ───────────────────────────────────────────────────────────
    /**
     * ObjectId of the user who performed the action.
     * NOT a ref→ join because the user could be deleted; this is an audit trail.
     */
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Performer ID is required"],
      index: true,
    },

    /**
     * Snapshot of the performer's name/mobile at the time of the action.
     * Stored because the user's name may change later.
     */
    performedByName: {
      type: String,
      default: null,
      trim: true,
    },

    /**
     * Snapshot of the performer's role at the time of the action.
     */
    performedByRole: {
      type: String,
      default: null,
      trim: true,
    },

    // ─── Financial snapshot ───────────────────────────────────────────────────
    /**
     * Financial details relevant to this action.
     * All fields are optional — fill only what applies to the action type.
     */
    financialDetails: {
      amount: {
        type: Number,
        default: null,
      },
      paymentMode: {
        type: String,
        default: null,
      },
      referenceNumber: {
        type: String,
        default: null,
        trim: true,
      },
      previousStatus: {
        type: String,
        default: null,
      },
      newStatus: {
        type: String,
        default: null,
      },
    },

    // ─── Technical metadata ───────────────────────────────────────────────────
    /**
     * IP address of the request. May be null if not available (e.g., server-side action).
     */
    ipAddress: {
      type: String,
      default: null,
      trim: true,
    },

    /**
     * User-Agent string from the HTTP request, if available.
     */
    userAgent: {
      type: String,
      default: null,
      trim: true,
    },

    // ─── Before/After state ───────────────────────────────────────────────────
    /**
     * Used for edit/update operations to record what changed.
     * `before`: The previous value(s).
     * `after`:  The new value(s).
     * Keep these minimal — store only what changed, not the entire document.
     */
    changes: {
      before: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      after: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },

    /**
     * Free-text notes for additional context.
     */
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    // Only createdAt — audit logs are immutable, no updatedAt needed
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Compound index: entity history (most common query pattern)
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
// User activity feed
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
// Action-based filter (e.g., "show me all settlements")
auditLogSchema.index({ action: 1, createdAt: -1 });
// Chronological browse (all logs, latest first)
auditLogSchema.index({ createdAt: -1 });
// Payment mode filter for financial reports
auditLogSchema.index({ "financialDetails.paymentMode": 1, createdAt: -1 });

// ─── Guard: prevent accidental update hooks ───────────────────────────────────
// This does NOT prevent all updates at the DB level (use role-based routes for that),
// but it signals intent and prevents pre/post update middleware from running.
auditLogSchema.set("strict", true);

module.exports =
  mainDb.models.AuditLog || mainDb.model("AuditLog", auditLogSchema);
