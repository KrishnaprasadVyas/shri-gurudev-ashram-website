const User = require("../models/User");
const Donation = require("../models/Donation");

/**
 * Collector Service
 * Handles referral code generation, validation, and leaderboard queries.
 * No commission/incentive system - purely for donation attribution.
 */

/**
 * Generate a unique, human-readable referral code
 * Format: COL + 6 random alphanumeric chars (e.g., COLA7F9X2)
 * Ensures uniqueness by checking against existing codes
 */
const generateReferralCode = async () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded O, 0, I, 1 for readability
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let code = "COL";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if code already exists
    const exists = await User.findOne({ referralCode: code }).lean();
    if (!exists) {
      return code;
    }
  }

  // Fallback: use timestamp-based code if random fails
  return `COL${Date.now().toString(36).toUpperCase().slice(-6)}`;
};

/**
 * Assign referral code to a user (call during registration)
 * Idempotent: won't overwrite existing code
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string|null} The referral code or null on failure
 */
const assignReferralCode = async (userId) => {
  // FIX 1: Retry once on duplicate key error (race condition safety)
  const maxRetries = 2;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      // Don't overwrite existing code (immutable)
      if (user.referralCode) return user.referralCode;

      const code = await generateReferralCode();

      // Use findByIdAndUpdate to avoid race conditions
      const updated = await User.findByIdAndUpdate(
        userId,
        { $set: { referralCode: code } },
        { new: true }
      );

      return updated?.referralCode || null;
    } catch (error) {
      // FIX 1: Retry on duplicate key error (code 11000)
      const isDuplicateKeyError = error.code === 11000;
      if (isDuplicateKeyError && attempt < maxRetries - 1) {
        console.warn(
          `[CollectorService] Duplicate referral code collision, retrying (attempt ${attempt + 1})`
        );
        continue;
      }
      console.error("[CollectorService] assignReferralCode error:", error);
      return null;
    }
  }

  return null;
};

/**
 * Resolve referral code to collector info
 * Safe: returns null if code is invalid/missing (no error thrown)
 * @param {string} referralCode - The referral code from URL query param
 * @returns {Object|null} { collectorId, collectorName } or null
 */
const resolveCollector = async (referralCode) => {
  try {
    // Guard: empty or invalid input
    if (!referralCode || typeof referralCode !== "string") {
      return null;
    }

    const code = referralCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      return null;
    }

    const collector = await User.findOne({ referralCode: code })
      .select("_id fullName collectorProfile.fullName collectorDisabled")
      .lean();

    if (!collector) {
      console.warn(`[CollectorService] Invalid referral code: ${code}`);
      return null;
    }

    // Check if collector is disabled by admin
    if (collector.collectorDisabled) {
      console.warn(`[CollectorService] Collector disabled: ${code}`);
      return null;
    }

    // Use fullName or fall back to collectorProfile.fullName
    const name = collector.fullName || collector.collectorProfile?.fullName;
    if (!name) {
      console.warn(`[CollectorService] Collector has no fullName: ${code}`);
      return null;
    }

    return {
      collectorId: collector._id,
      collectorName: name,
    };
  } catch (error) {
    // Never crash - just log and return null
    console.error("[CollectorService] resolveCollector error:", error);
    return null;
  }
};

/**
 * Validate referral code and return collector info
 * Strict validation for /api/referral/validate/:code endpoint
 * @param {string} referralCode - The referral code to validate
 * @returns {Object} { valid: boolean, collectorId?, collectorName?, error? }
 */
const validateReferralCode = async (referralCode) => {
  // Anti-enumeration: All invalid states return same generic error
  const GENERIC_ERROR = { valid: false, error: "Invalid or inactive referral code" };

  try {
    if (!referralCode || typeof referralCode !== "string") {
      return GENERIC_ERROR;
    }

    const code = referralCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      return GENERIC_ERROR;
    }

    const collector = await User.findOne({ referralCode: code })
      .select("_id fullName collectorProfile.fullName collectorDisabled")
      .lean();

    if (!collector) {
      return GENERIC_ERROR;
    }

    if (collector.collectorDisabled) {
      return GENERIC_ERROR;
    }

    // Use fullName or fall back to collectorProfile.fullName
    const name = collector.fullName || collector.collectorProfile?.fullName;
    if (!name) {
      return GENERIC_ERROR;
    }

    return {
      valid: true,
      collectorId: collector._id,
      collectorName: name,
    };
  } catch (error) {
    console.error("[CollectorService] validateReferralCode error:", error);
    return GENERIC_ERROR;
  }
};

/**
 * Get collector dashboard data
 * @param {string} userId - Collector's user ID
 * @returns {Object} Dashboard data with stats, leaderboard, recent donations
 */
const getCollectorDashboard = async (userId) => {
  try {
    const mongoose = require("mongoose");
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get collector's stats
    const stats = await Donation.aggregate([
      {
        $match: {
          hasCollectorAttribution: true,
          collectorId: userObjectId,
          status: "SUCCESS",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
    ]);

    // Get top 5 collectors for leaderboard
    const top5Collectors = await getTopCollectors(5);

    // Get recent 10 donations for this collector
    const recentDonations = await Donation.find({
      hasCollectorAttribution: true,
      collectorId: userObjectId,
      status: "SUCCESS",
    })
      .select("donor.name donor.anonymousDisplay amount donationHead.name createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Format recent donations
    const formattedDonations = recentDonations.map((d) => ({
      donorName: d.donor?.anonymousDisplay ? "Anonymous" : d.donor?.name || "Unknown",
      amount: d.amount,
      cause: d.donationHead?.name || "General",
      date: d.createdAt,
    }));

    return {
      totalAmount: stats[0]?.totalAmount || 0,
      donationCount: stats[0]?.donationCount || 0,
      top5Collectors,
      recentDonations: formattedDonations,
    };
  } catch (error) {
    console.error("[CollectorService] getCollectorDashboard error:", error);
    return null;
  }
};

/**
 * Get top collectors by total donation amount
 * Uses MongoDB aggregation for efficiency
 * @param {number} limit - Number of top collectors to return (default: 5)
 * @returns {Array} Ranked list of collectors with totalAmount and donationCount
 */
const getTopCollectors = async (limit = 5) => {
  try {
    const leaderboard = await Donation.aggregate([
      // BUG FIX: Only count donations that explicitly had a referral code
      // Historical donations without hasCollectorAttribution field are excluded
      {
        $match: {
          hasCollectorAttribution: true, // Only explicit attributions
          collectorId: { $ne: null },
          status: "SUCCESS",
        },
      },
      // Group by collector
      {
        $group: {
          _id: "$collectorId",
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
          // Keep the most recent collector name snapshot
          collectorName: { $last: "$collectorName" },
        },
      },
      // Sort by total amount descending
      {
        $sort: { totalAmount: -1 },
      },
      // Limit results
      {
        $limit: limit,
      },
      // FIX 2: Removed $lookup - use stored collectorName snapshot directly
      // Reshape output
      {
        $project: {
          _id: 0,
          collectorId: "$_id",
          collectorName: { $ifNull: ["$collectorName", "Unknown Collector"] },
          totalAmount: 1,
          donationCount: 1,
        },
      },
    ]);

    // Add rank
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  } catch (error) {
    console.error("[CollectorService] getTopCollectors error:", error);
    return [];
  }
};

/**
 * Get collector stats for a specific user
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Object} { referralCode, totalAmount, donationCount }
 */
const getCollectorStats = async (userId) => {
  try {
    const user = await User.findById(userId).select("referralCode fullName").lean();
    if (!user) return null;

    const stats = await Donation.aggregate([
      {
        $match: {
          hasCollectorAttribution: true, // BUG FIX: Only explicit attributions
          collectorId: user._id,
          status: "SUCCESS",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
    ]);

    return {
      referralCode: user.referralCode || null,
      collectorName: user.fullName,
      totalAmount: stats[0]?.totalAmount || 0,
      donationCount: stats[0]?.donationCount || 0,
    };
  } catch (error) {
    console.error("[CollectorService] getCollectorStats error:", error);
    return null;
  }
};

module.exports = {
  generateReferralCode,
  assignReferralCode,
  resolveCollector,
  validateReferralCode,
  getTopCollectors,
  getCollectorStats,
  getCollectorDashboard,
};
