const Counter = require("../models/Counter");

/**
 * Counter Service
 * ERP Phase 1 — Atomic sequential reference number generator
 *
 * Provides collision-proof sequential numbers for all financial documents.
 *
 * Supported prefixes and their document types:
 * ┌────────┬──────────────────────────────────┬──────────────────┐
 * │ Prefix │ Document                         │ Example          │
 * ├────────┼──────────────────────────────────┼──────────────────┤
 * │ CA     │ Cash donation receipt            │ CA-000001        │
 * │ CH     │ Cheque donation receipt          │ CH-000001        │
 * │ UPI    │ UPI donation receipt             │ UPI-000001       │
 * │ OL     │ Online (Razorpay) donation receipt│ OL-000001       │
 * │ ADV    │ Cash advance reference number    │ ADV-000001       │
 * │ VCH    │ Expense voucher number           │ VCH-000001       │
 * └────────┴──────────────────────────────────┴──────────────────┘
 *
 * DESIGN PRINCIPLES:
 * - Atomic: Uses MongoDB's $inc — no race conditions
 * - Upsert: Counter document auto-created if it doesn't exist (no seeding needed)
 * - Immutable: Once issued, a number is never reused (gaps are acceptable)
 * - Session-aware: Accepts optional MongoDB session for transaction support
 */

/**
 * Supported counter prefixes.
 * This is validated to prevent typos creating phantom counter documents.
 */
const VALID_PREFIXES = ["CA", "CH", "UPI", "OL", "ADV", "VCH"];

/**
 * Padding length for the sequence number portion.
 * 6 digits supports up to 999,999 documents per prefix before overflow.
 * At typical ashram volume, this provides decades of headroom.
 */
const PAD_LENGTH = 6;

/**
 * Get the next sequential reference number for a given prefix.
 *
 * This function is the ONLY way to obtain a new reference number.
 * It is atomic — two concurrent calls for the same prefix will always
 * return different numbers, guaranteed by MongoDB's $inc semantics.
 *
 * @param {string} prefix - One of the VALID_PREFIXES (e.g., "ADV", "CA")
 * @param {import("mongoose").ClientSession|null} session - Optional MongoDB session
 *        Pass the active session when calling inside a transaction.
 * @returns {Promise<string>} Formatted reference string (e.g., "ADV-000001")
 * @throws {Error} If prefix is not in VALID_PREFIXES
 * @throws {Error} If the database operation fails
 *
 * @example
 * // Outside a transaction:
 * const advNo = await getNextNumber("ADV");        // → "ADV-000001"
 * const vchNo = await getNextNumber("VCH");        // → "VCH-000001"
 *
 * @example
 * // Inside a MongoDB transaction:
 * const session = await mainDb.startSession();
 * await session.withTransaction(async () => {
 *   const vchNo = await getNextNumber("VCH", session);
 *   await Voucher.create([{ voucherNumber: vchNo }], { session });
 * });
 */
const getNextNumber = async (prefix, session = null) => {
  // Validate prefix — fail fast before touching the database
  if (!VALID_PREFIXES.includes(prefix)) {
    throw new Error(
      `[CounterService] Invalid prefix "${prefix}". ` +
        `Valid prefixes: ${VALID_PREFIXES.join(", ")}`,
    );
  }

  // Build the findOneAndUpdate options
  const options = {
    // Create the counter document if it doesn't exist yet (upsert)
    upsert: true,
    // Return the document AFTER the update so we have the new seq value
    returnDocument: "after",
    // Ensure we return the full document (Mongoose default, but explicit is safer)
    new: true,
  };

  // Attach the session if one is provided (for transaction support)
  if (session) {
    options.session = session;
  }

  // Atomic increment — this is the heart of the service
  const result = await Counter.findOneAndUpdate(
    { _id: prefix },
    { $inc: { seq: 1 } },
    options,
  );

  if (!result || typeof result.seq !== "number") {
    throw new Error(
      `[CounterService] Failed to get next number for prefix "${prefix}". ` +
        `Counter document may be corrupted.`,
    );
  }

  // Format: PREFIX-PADDED_SEQUENCE (e.g., "ADV-000001")
  const paddedSeq = String(result.seq).padStart(PAD_LENGTH, "0");
  return `${prefix}-${paddedSeq}`;
};

/**
 * Peek at the current sequence value without incrementing.
 * Useful for reporting. NOT for issuing numbers — use getNextNumber() instead.
 *
 * @param {string} prefix - One of the VALID_PREFIXES
 * @returns {Promise<number>} Current seq value (0 if counter doesn't exist yet)
 */
const peekCurrentSeq = async (prefix) => {
  if (!VALID_PREFIXES.includes(prefix)) {
    throw new Error(
      `[CounterService] Invalid prefix "${prefix}". ` +
        `Valid prefixes: ${VALID_PREFIXES.join(", ")}`,
    );
  }

  const counter = await Counter.findById(prefix).lean();
  return counter ? counter.seq : 0;
};

module.exports = {
  getNextNumber,
  peekCurrentSeq,
  VALID_PREFIXES,
};
