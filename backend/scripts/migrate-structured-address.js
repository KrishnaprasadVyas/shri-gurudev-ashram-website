/**
 * NON-DESTRUCTIVE Migration: Populate structured addressObj from legacy address strings
 * 
 * This script:
 * 1. Finds all donations that have donor.address (string) but no donor.addressObj
 * 2. Parses the address string to extract city, state, pincode
 * 3. Sets donor.addressObj WITHOUT touching the original donor.address field
 * 4. Logs all changes for audit
 * 
 * SAFE TO RUN MULTIPLE TIMES (idempotent)
 * DOES NOT DELETE any existing data
 * 
 * Usage:
 *   node scripts/migrate-structured-address.js [--dry-run]
 * 
 * Options:
 *   --dry-run   Preview changes without writing to database
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Donation = require("../src/models/Donation");

const DRY_RUN = process.argv.includes("--dry-run");

// Common Indian states for address parsing
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry", "Jammu and Kashmir", "Ladakh",
  // Abbreviations
  "AP", "AR", "AS", "BR", "CG", "GA", "GJ", "HR", "HP", "JH",
  "KA", "KL", "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "PB",
  "RJ", "SK", "TN", "TS", "TR", "UP", "UK", "WB", "DL", "CH", "PY", "JK", "LA",
];

/**
 * Parse a legacy address string into structured fields
 * Best-effort extraction - does not guarantee accuracy
 */
function parseAddressString(address) {
  if (!address || typeof address !== "string") {
    return { line: "", city: "", state: "", country: "India", pincode: "" };
  }

  const result = { line: "", city: "", state: "", country: "India", pincode: "" };

  // Extract pincode (6-digit number, possibly preceded by - or space)
  const pincodeMatch = address.match(/[-\s]?(\d{6})\s*$/);
  if (pincodeMatch) {
    result.pincode = pincodeMatch[1];
  }

  // Remove pincode from address for further processing
  let working = address.replace(/[-\s]?\d{6}\s*$/, "").trim();

  // Split by commas
  const parts = working.split(",").map(p => p.trim()).filter(Boolean);

  if (parts.length === 0) {
    result.line = address;
    return result;
  }

  // Try to find state in parts (check from end)
  let stateIndex = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].trim();
    const found = INDIAN_STATES.find(
      s => part.toLowerCase() === s.toLowerCase() || 
           part.toLowerCase().includes(s.toLowerCase())
    );
    if (found) {
      result.state = found;
      stateIndex = i;
      break;
    }
  }

  if (stateIndex > 0) {
    // City is typically the part before state
    result.city = parts[stateIndex - 1];
    // Line is everything before city
    result.line = parts.slice(0, stateIndex - 1).join(", ");
  } else if (parts.length >= 3) {
    // No state found: assume last is state-like, second-to-last is city
    result.state = parts[parts.length - 1];
    result.city = parts[parts.length - 2];
    result.line = parts.slice(0, parts.length - 2).join(", ");
  } else if (parts.length === 2) {
    result.city = parts[1];
    result.line = parts[0];
  } else {
    result.line = parts[0];
  }

  return result;
}

async function migrate() {
  console.log("=".repeat(60));
  console.log(`MIGRATION: Populate structured addressObj from legacy addresses`);
  console.log(`MODE: ${DRY_RUN ? "DRY RUN (no changes will be written)" : "LIVE"}`);
  console.log(`DATE: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!MONGO_URI) {
    console.error("ERROR: MONGO_URI not found in environment");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Find donations with legacy address but no structured addressObj
  const donations = await Donation.find({
    "donor.address": { $exists: true, $ne: "" },
    $or: [
      { "donor.addressObj": { $exists: false } },
      { "donor.addressObj.city": { $exists: false } },
      { "donor.addressObj.city": "" },
    ],
  }).select("donor.address donor.addressObj").lean();

  console.log(`Found ${donations.length} donations to migrate\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const donation of donations) {
    try {
      const parsed = parseAddressString(donation.donor.address);

      // Only update if we extracted meaningful data
      if (!parsed.city && !parsed.state && !parsed.pincode) {
        console.log(`  SKIP ${donation._id}: Could not parse address: "${donation.donor.address}"`);
        skipped++;
        continue;
      }

      console.log(`  ${DRY_RUN ? "[DRY]" : "UPDATE"} ${donation._id}:`);
      console.log(`    Original: "${donation.donor.address}"`);
      console.log(`    Parsed:   line="${parsed.line}", city="${parsed.city}", state="${parsed.state}", pincode="${parsed.pincode}"`);

      if (!DRY_RUN) {
        await Donation.updateOne(
          { _id: donation._id },
          { $set: { "donor.addressObj": parsed } }
        );
      }

      migrated++;
    } catch (err) {
      console.error(`  ERROR ${donation._id}: ${err.message}`);
      errors++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION COMPLETE");
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Errors:   ${errors}`);
  console.log(`  Total:    ${donations.length}`);
  console.log("=".repeat(60));

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
