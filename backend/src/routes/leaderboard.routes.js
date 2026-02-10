const express = require("express");
const router = express.Router();
const { getTopCollectors } = require("../services/collector.service");

/**
 * LEADERBOARD ROUTES
 * Public endpoints for collector leaderboard
 */

/**
 * Get top collectors leaderboard
 * GET /api/leaderboard/top
 * 
 * Returns top 5 collectors by total donation amount
 * Only includes SUCCESS donations with hasCollectorAttribution = true
 * 
 * Response:
 * {
 *   success: true,
 *   data: [
 *     {
 *       rank: 1,
 *       collectorId: ObjectId,
 *       collectorName: string,
 *       totalAmount: number,
 *       donationCount: number
 *     },
 *     ...
 *   ]
 * }
 */
router.get("/top", async (req, res) => {
  try {
    const topCollectors = await getTopCollectors(5);

    res.status(200).json({
      success: true,
      data: topCollectors,
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
      data: [],
    });
  }
});

module.exports = router;
