const Donation = require("../models/Donation");
const { resolveCollector } = require("../services/collector.service");

/**
 * PUBLIC API: Validate Referral Code
 * GET /api/public/referral/:code
 *
 * Returns collector name if referral code is valid.
 * No authentication required.
 *
 * Response: { valid: true, collectorName } or { valid: false }
 */
exports.validateReferralCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length < 4) {
      return res.json({ valid: false });
    }

    const collector = await resolveCollector(code);

    if (!collector) {
      return res.json({ valid: false });
    }

    // Only return collector name - never expose IDs to public
    res.json({
      valid: true,
      collectorName: collector.collectorName,
    });
  } catch (error) {
    console.error("Error validating referral code:", error);
    res.json({ valid: false });
  }
};

/**
 * PUBLIC API: Get Recent Donations
 * GET /api/public/donations/recent
 *
 * Returns last 10 successful donations with public-safe data only.
 * No authentication required.
 *
 * Response: Array of { id, name, city, amount }
 * - name: "Anonymous" if donor opted for anonymous display
 * - city: Extracted from address or defaults to "India"
 */
exports.getRecentDonations = async (req, res) => {
  try {
    // Fetch last 10 successful donations, sorted by newest first
    const donations = await Donation.find({ status: "SUCCESS" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("donor.name donor.address donor.addressObj donor.anonymousDisplay amount")
      .lean();

    // Transform to public-safe format
    const publicDonations = donations.map((donation, index) => {
      // Respect anonymity preference
      const displayName = donation.donor.anonymousDisplay
        ? "Anonymous"
        : donation.donor.name;

      // Prefer structured city, fallback to legacy address parsing
      const city = donation.donor?.addressObj?.city
        ? donation.donor.addressObj.city
        : extractCity(donation.donor.address);

      return {
        id: `recent-${index}-${Date.now()}`, // Unique ID for React keys
        name: displayName,
        city: city,
        amount: donation.amount,
      };
    });

    res.json(publicDonations);
  } catch (error) {
    console.error("Error fetching recent donations:", error);
    res.status(500).json({ message: "Failed to fetch recent donations" });
  }
};

/**
 * PUBLIC API: Get Top Donors
 * GET /api/public/donations/top
 *
 * Aggregates donations by donor name and returns top 5 by total amount.
 * Excludes anonymous donors from the leaderboard.
 * No authentication required.
 *
 * Response: Array of { id, name, totalAmount }
 */
exports.getTopDonors = async (req, res) => {
  try {
    // Aggregate donations by donor name
    // Only include successful donations where anonymousDisplay is false
    const topDonors = await Donation.aggregate([
      // Stage 1: Filter successful, non-anonymous donations
      {
        $match: {
          status: "SUCCESS",
          "donor.anonymousDisplay": { $ne: true },
        },
      },
      // Stage 2: Group by donor name and sum amounts
      {
        $group: {
          _id: "$donor.name",
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
      // Stage 3: Sort by total amount descending
      {
        $sort: { totalAmount: -1 },
      },
      // Stage 4: Limit to top 5
      {
        $limit: 5,
      },
      // Stage 5: Project to final format
      {
        $project: {
          _id: 0,
          name: "$_id",
          totalAmount: 1,
        },
      },
    ]);

    // Add sequential IDs for frontend
    const result = topDonors.map((donor, index) => ({
      id: index + 1,
      name: donor.name,
      totalAmount: donor.totalAmount,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching top donors:", error);
    res.status(500).json({ message: "Failed to fetch top donors" });
  }
};

/**
 * Helper: Extract city from address string
 * Attempts to parse Indian address format to extract city name.
 * Falls back to "India" if extraction fails.
 *
 * @param {string} address - Full address string
 * @returns {string} City name or "India"
 */
function extractCity(address) {
  if (!address) return "India";

  // Common Indian address patterns:
  // "Street, Area, City, State - Pincode"
  // "Street, City, State Pincode"

  // Remove pincode (6 digits, optionally with hyphen/space prefix)
  const withoutPincode = address.replace(/[-\s]?\d{6}\s*$/, "").trim();

  // Split by commas and get parts
  const parts = withoutPincode.split(",").map((p) => p.trim());

  if (parts.length >= 2) {
    // Get second-to-last part (usually city before state)
    // Or last part if only 2 parts
    const cityPart =
      parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1];

    // Clean up the city name (remove state names, etc.)
    const cleanCity = cityPart
      .replace(
        /\b(Maharashtra|Gujarat|Karnataka|Tamil Nadu|Delhi|Rajasthan|UP|MP|Bihar|West Bengal|Telangana|Andhra Pradesh)\b/gi,
        "",
      )
      .trim();

    if (cleanCity && cleanCity.length > 1) {
      return cleanCity;
    }
  }

  // Fallback: try to find a capitalized word that looks like a city
  const words = address.split(/[\s,]+/);
  for (const word of words) {
    if (word.length > 3 && /^[A-Z][a-z]+$/.test(word)) {
      return word;
    }
  }

  return "India";
}
