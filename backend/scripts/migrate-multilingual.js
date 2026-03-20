/**
 * Migration: Convert plain-string translatable fields to multilingual { en, hi, mr } objects
 *
 * Affects 6 models: Event, Activity, DonationHead, GalleryCategory, Announcement, Banner
 *
 * SAFE TO RUN MULTIPLE TIMES (idempotent) — skips fields already in object format.
 * DOES NOT DELETE any existing data — wraps the original string as the English value.
 *
 * Usage:
 *   node scripts/migrate-multilingual.js [--dry-run]
 *
 * Options:
 *   --dry-run   Preview changes without writing to database
 */

require("dotenv").config();
const mongoose = require("mongoose");

const DRY_RUN = process.argv.includes("--dry-run");

// Define what to migrate per collection
const MIGRATIONS = [
  {
    name: "Event",
    collection: "events",
    topLevel: ["title", "description", "location"],
    nested: [],
  },
  {
    name: "Activity",
    collection: "activities",
    topLevel: ["title", "description"],
    nested: [
      {
        arrayField: "subitems",
        fields: ["title", "description"],
        arrayOfStringsField: "points",
      },
    ],
  },
  {
    name: "DonationHead",
    collection: "donationheads",
    topLevel: ["name", "description", "longDescription"],
    nested: [
      {
        arrayField: "subCauses",
        fields: ["name", "description"],
      },
    ],
  },
  {
    name: "GalleryCategory",
    collection: "gallerycategories",
    topLevel: ["name", "description"],
    nested: [
      {
        arrayField: "images",
        fields: ["title", "altText"],
      },
    ],
  },
  {
    name: "Announcement",
    collection: "announcements",
    topLevel: ["text", "linkText"],
    nested: [],
  },
  {
    name: "Banner",
    collection: "banners",
    topLevel: ["title", "subtitle", "description", "ctaText"],
    nested: [],
  },
];

/**
 * Convert a plain string to multilingual object.
 * Returns null if already an object (skip).
 */
function toMultilingual(value) {
  if (value === null || value === undefined) {
    return { en: "", hi: "", mr: "" };
  }
  if (typeof value === "string") {
    return { en: value, hi: "", mr: "" };
  }
  // Already an object — skip
  return null;
}

async function migrateCollection(db, config) {
  const collection = db.collection(config.collection);
  const docs = await collection.find({}).toArray();

  let migrated = 0;
  let skipped = 0;
  const ops = [];

  for (const doc of docs) {
    const updates = {};
    let needsUpdate = false;

    // Top-level fields
    for (const field of config.topLevel) {
      const converted = toMultilingual(doc[field]);
      if (converted !== null) {
        updates[field] = converted;
        needsUpdate = true;
      }
    }

    // Nested array fields
    for (const nested of config.nested) {
      const arr = doc[nested.arrayField];
      if (!Array.isArray(arr)) continue;

      let arrayModified = false;
      const newArr = arr.map((item) => {
        const newItem = { ...item };
        let itemModified = false;

        // Regular string fields in nested array
        if (nested.fields) {
          for (const field of nested.fields) {
            const converted = toMultilingual(item[field]);
            if (converted !== null) {
              newItem[field] = converted;
              itemModified = true;
            }
          }
        }

        // Array-of-strings field (e.g. points)
        if (
          nested.arrayOfStringsField &&
          Array.isArray(item[nested.arrayOfStringsField])
        ) {
          const points = item[nested.arrayOfStringsField];
          let pointsModified = false;
          const newPoints = points.map((p) => {
            const converted = toMultilingual(p);
            if (converted !== null) {
              pointsModified = true;
              return converted;
            }
            return p;
          });
          if (pointsModified) {
            newItem[nested.arrayOfStringsField] = newPoints;
            itemModified = true;
          }
        }

        if (itemModified) arrayModified = true;
        return itemModified ? newItem : item;
      });

      if (arrayModified) {
        updates[nested.arrayField] = newArr;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      if (DRY_RUN) {
        console.log(
          `  [DRY] ${config.name} ${doc._id}: would update ${Object.keys(updates).join(", ")}`,
        );
      }
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: updates },
        },
      });
      migrated++;
    } else {
      skipped++;
    }
  }

  if (ops.length > 0 && !DRY_RUN) {
    await collection.bulkWrite(ops);
  }

  return { total: docs.length, migrated, skipped };
}

async function migrate() {
  console.log("=".repeat(60));
  console.log("MIGRATION: Convert translatable fields to multilingual objects");
  console.log(
    `MODE: ${DRY_RUN ? "DRY RUN (no changes will be written)" : "LIVE"}`,
  );
  console.log(`DATE: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!MONGO_URI) {
    console.error("ERROR: MONGO_URI not found in environment");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB\n");

  const db = mongoose.connection.db;
  const summary = [];

  for (const config of MIGRATIONS) {
    console.log(`--- ${config.name} ---`);
    try {
      const result = await migrateCollection(db, config);
      console.log(
        `  Total: ${result.total}, Migrated: ${result.migrated}, Skipped: ${result.skipped}\n`,
      );
      summary.push({ model: config.name, ...result });
    } catch (err) {
      console.error(`  ERROR: ${err.message}\n`);
      summary.push({
        model: config.name,
        total: 0,
        migrated: 0,
        skipped: 0,
        error: err.message,
      });
    }
  }

  console.log("=".repeat(60));
  console.log("MIGRATION SUMMARY");
  for (const s of summary) {
    const status = s.error
      ? `ERROR: ${s.error}`
      : `${s.migrated} migrated, ${s.skipped} skipped`;
    console.log(`  ${s.model}: ${status}`);
  }
  console.log("=".repeat(60));

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
