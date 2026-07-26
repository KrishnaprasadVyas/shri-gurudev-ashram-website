const mongoose = require("mongoose");
const { mainDb } = require("../config/db");

/**
 * Counter Schema
 * ERP Phase 1 — Atomic sequential number generator
 *
 * PURPOSE:
 * Generates collision-proof, sequential document reference numbers for all
 * financial documents (advances, vouchers, receipts).
 *
 * HOW IT WORKS:
 * Each prefix (e.g., "ADV", "VCH", "CA") has one Counter document.
 * `getNextNumber()` in counter.service.js uses atomic $inc to increment `seq`
 * and returns the formatted string (e.g., "ADV-000001").
 *
 * SEEDING (Phase 2):
 * Before Phase 2 goes live, these documents must exist:
 *   { _id: "CA",  seq: 0 }
 *   { _id: "CH",  seq: 0 }
 *   { _id: "UPI", seq: 0 }
 *   { _id: "OL",  seq: 0 }
 *   { _id: "ADV", seq: 0 }
 *   { _id: "VCH", seq: 0 }
 *
 * The counter.service.js handles this via upsert — no manual seeding needed.
 *
 * COLLISION SAFETY:
 * MongoDB findOneAndUpdate with $inc is atomic. Even under concurrent requests,
 * two calls to getNextNumber("ADV") will always return different numbers.
 *
 * IMMUTABILITY:
 * Once a number is issued (seq is incremented), it is never decremented.
 * Gaps in sequence (e.g., cancelled operations) are acceptable and normal
 * in accounting practice.
 */
const counterSchema = new mongoose.Schema(
  {
    /**
     * The prefix identifier. Also the document _id for O(1) lookup.
     * Examples: "CA", "CH", "UPI", "OL", "ADV", "VCH"
     */
    _id: {
      type: String,
      required: true,
    },

    /**
     * Current sequence value. Starts at 0.
     * Atomically incremented by 1 on each getNextNumber() call.
     * The returned number is seq AFTER increment (post-increment).
     */
    seq: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    // No timestamps needed — this is a technical utility collection
    timestamps: false,
    // Prevent schema validation issues on $inc operations
    strict: false,
  },
);

// _id is already the primary index (MongoDB default)
// No additional indexes needed — all lookups are by _id

module.exports =
  mainDb.models.Counter || mainDb.model("Counter", counterSchema);
