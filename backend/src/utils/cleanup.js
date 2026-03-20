const Donation = require("../models/Donation");

/**
 * Cleanup Tasks for Production
 * Run these periodically via cron job or process scheduler
 */

/**
 * Delete PENDING donations older than specified hours
 * These are abandoned payment flows that never completed
 *
 * @param {number} hoursOld - Delete donations older than this many hours (default: 24)
 * @returns {Promise<number>} - Number of deleted donations
 */
const cleanupPendingDonations = async (hoursOld = 24) => {
  try {
    const cutoffDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

    const result = await Donation.deleteMany({
      status: "PENDING",
      createdAt: { $lt: cutoffDate },
    });

    console.log(
      `Cleanup: Deleted ${result.deletedCount} old PENDING donations (older than ${hoursOld}h)`,
    );
    return result.deletedCount;
  } catch (error) {
    console.error("Cleanup error (pending donations):", error.message);
    return 0;
  }
};

/**
 * Run all cleanup tasks
 * Call this from a scheduled job (e.g., every 6 hours)
 */
const runAllCleanupTasks = async () => {
  console.log("Starting scheduled cleanup tasks...");

  await cleanupPendingDonations(24); // Delete PENDING older than 24h

  console.log("Cleanup tasks completed");
};

/**
 * Start cleanup scheduler
 * Runs cleanup every specified interval
 *
 * @param {number} intervalHours - Run cleanup every X hours (default: 6)
 */
const startCleanupScheduler = (intervalHours = 6) => {
  const intervalMs = intervalHours * 60 * 60 * 1000;

  console.log(`Cleanup scheduler started (runs every ${intervalHours}h)`);

  // Run immediately on startup
  setTimeout(() => runAllCleanupTasks(), 10000); // Wait 10s for DB connection

  // Then run periodically
  setInterval(() => runAllCleanupTasks(), intervalMs);
};

module.exports = {
  cleanupPendingDonations,
  runAllCleanupTasks,
  startCleanupScheduler,
};
