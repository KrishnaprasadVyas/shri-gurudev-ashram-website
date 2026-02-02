/**
 * GALLERY IMAGE MIGRATION SCRIPT
 * 
 * PURPOSE:
 * This script analyzes existing gallery images and provides tools for migration.
 * It does NOT break existing images - both old and new URLs work simultaneously.
 * 
 * WHAT IT DOES:
 * 1. Scans all gallery categories in MongoDB
 * 2. Identifies images using old /assets/Brochure/ URLs
 * 3. Identifies images using new /uploads/gallery/ URLs
 * 4. Provides statistics and optional migration helpers
 * 
 * USAGE:
 * - Run: node scripts/migrate-gallery-images.js --analyze
 * - For actual migration: node scripts/migrate-gallery-images.js --migrate
 * 
 * NOTE: This script is OPTIONAL. Old URLs continue to work.
 * Only run migration if you want to consolidate all images to /uploads/
 */

const path = require("path");

// Load .env from backend root (one level up from scripts/)
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const fs = require("fs");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

// Import models
const GalleryCategory = require("../src/models/GalleryCategory");

// Directories
const OLD_ASSETS_BASE = path.join(__dirname, "../../frontend/public");
const NEW_UPLOADS_DIR = path.join(__dirname, "../uploads/gallery");
const THUMBNAILS_DIR = path.join(__dirname, "../uploads/gallery/thumbnails");

// Ensure directories exist
const ensureDirectories = () => {
  if (!fs.existsSync(NEW_UPLOADS_DIR)) {
    fs.mkdirSync(NEW_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(THUMBNAILS_DIR)) {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
  }
};

/**
 * Analyze all gallery images and categorize by URL type
 */
async function analyzeImages() {
  console.log("\n📊 GALLERY IMAGE ANALYSIS\n");
  console.log("=".repeat(50));

  const categories = await GalleryCategory.find().lean();

  let totalImages = 0;
  let oldAssetImages = 0;
  let newUploadImages = 0;
  let externalImages = 0;
  let unknownImages = 0;

  const oldAssetsList = [];
  const missingFiles = [];

  for (const category of categories) {
    for (const image of category.images || []) {
      totalImages++;

      if (image.url.startsWith("/assets/")) {
        oldAssetImages++;
        oldAssetsList.push({
          categoryId: category._id,
          categoryName: category.name,
          imageId: image._id,
          url: image.url,
        });

        // Check if file exists
        const filePath = path.join(OLD_ASSETS_BASE, image.url);
        if (!fs.existsSync(filePath)) {
          missingFiles.push({
            category: category.name,
            url: image.url,
          });
        }
      } else if (image.url.startsWith("/uploads/")) {
        newUploadImages++;
      } else if (image.url.startsWith("http")) {
        externalImages++;
      } else {
        unknownImages++;
      }
    }
  }

  console.log(`\n📁 Categories: ${categories.length}`);
  console.log(`📷 Total Images: ${totalImages}`);
  console.log(`\n📊 Image Sources:`);
  console.log(`   - Old /assets/Brochure/: ${oldAssetImages}`);
  console.log(`   - New /uploads/gallery/: ${newUploadImages}`);
  console.log(`   - External URLs: ${externalImages}`);
  console.log(`   - Unknown: ${unknownImages}`);

  if (missingFiles.length > 0) {
    console.log(`\n⚠️  Missing Files: ${missingFiles.length}`);
    missingFiles.forEach((f) => {
      console.log(`   - [${f.category}] ${f.url}`);
    });
  }

  console.log("\n" + "=".repeat(50));
  console.log("\n✅ Old /assets/ URLs continue to work - NO ACTION REQUIRED");
  console.log("   Frontend serves these directly from public folder.\n");
  console.log("   New uploads will use /uploads/gallery/ URLs.");
  console.log("   Both work simultaneously.\n");

  return { oldAssetsList, totalImages, oldAssetImages, newUploadImages };
}

/**
 * Migrate old /assets/ images to /uploads/
 * Creates optimized WebP versions with thumbnails
 * Updates MongoDB URLs
 */
async function migrateImages(dryRun = true) {
  console.log(`\n🔄 MIGRATION ${dryRun ? "(DRY RUN)" : "(LIVE)"}\n`);
  console.log("=".repeat(50));

  ensureDirectories();

  const categories = await GalleryCategory.find();
  let migrated = 0;
  let failed = 0;
  let skipped = 0;

  for (const category of categories) {
    let categoryModified = false;

    for (const image of category.images) {
      // Only migrate /assets/ URLs
      if (!image.url.startsWith("/assets/")) {
        continue;
      }

      const oldFilePath = path.join(OLD_ASSETS_BASE, image.url);

      // Check if source file exists
      if (!fs.existsSync(oldFilePath)) {
        console.log(`⏭️  Skipped (file not found): ${image.url}`);
        skipped++;
        continue;
      }

      try {
        if (!dryRun) {
          // Generate new filename
          const uniqueId = uuidv4();
          const newFilename = `${uniqueId}.webp`;
          const thumbFilename = `thumb_${uniqueId}.webp`;

          const newFilePath = path.join(NEW_UPLOADS_DIR, newFilename);
          const thumbFilePath = path.join(THUMBNAILS_DIR, thumbFilename);

          // Read and process image
          const buffer = fs.readFileSync(oldFilePath);

          // Create optimized full-size WebP
          await sharp(buffer)
            .resize(1920, null, { withoutEnlargement: true, fit: "inside" })
            .webp({ quality: 80 })
            .toFile(newFilePath);

          // Create thumbnail
          await sharp(buffer)
            .resize(400, 300, { fit: "cover", position: "center" })
            .webp({ quality: 70 })
            .toFile(thumbFilePath);

          // Update image URLs
          image.url = `/uploads/gallery/${newFilename}`;
          image.thumbnailUrl = `/uploads/gallery/thumbnails/${thumbFilename}`;
          categoryModified = true;

          console.log(`✅ Migrated: ${path.basename(oldFilePath)} → ${newFilename}`);
        } else {
          console.log(`📋 Would migrate: ${image.url}`);
        }

        migrated++;
      } catch (error) {
        console.log(`❌ Failed: ${image.url} - ${error.message}`);
        failed++;
      }
    }

    // Save category if modified
    if (categoryModified && !dryRun) {
      await category.save();
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 Results:`);
  console.log(`   - Migrated: ${migrated}`);
  console.log(`   - Failed: ${failed}`);
  console.log(`   - Skipped: ${skipped}`);

  if (dryRun && migrated > 0) {
    console.log(`\n💡 To perform actual migration, run:`);
    console.log(`   node scripts/migrate-gallery-images.js --migrate\n`);
  }
}

/**
 * Add thumbnailUrl to images that have new /uploads/ URLs but missing thumbnails
 */
async function generateMissingThumbnails() {
  console.log("\n🖼️  GENERATING MISSING THUMBNAILS\n");
  console.log("=".repeat(50));

  ensureDirectories();

  const categories = await GalleryCategory.find();
  let generated = 0;

  for (const category of categories) {
    let modified = false;

    for (const image of category.images) {
      // Only process /uploads/ images without thumbnailUrl
      if (image.url.startsWith("/uploads/gallery/") && !image.thumbnailUrl) {
        const filename = path.basename(image.url);
        const fullPath = path.join(NEW_UPLOADS_DIR, filename);

        if (fs.existsSync(fullPath)) {
          try {
            const thumbFilename = `thumb_${filename}`;
            const thumbPath = path.join(THUMBNAILS_DIR, thumbFilename);

            if (!fs.existsSync(thumbPath)) {
              await sharp(fullPath)
                .resize(400, 300, { fit: "cover", position: "center" })
                .webp({ quality: 70 })
                .toFile(thumbPath);
            }

            image.thumbnailUrl = `/uploads/gallery/thumbnails/${thumbFilename}`;
            modified = true;
            generated++;
            console.log(`✅ Generated thumbnail for: ${filename}`);
          } catch (error) {
            console.log(`❌ Failed: ${filename} - ${error.message}`);
          }
        }
      }
    }

    if (modified) {
      await category.save();
    }
  }

  console.log(`\n📊 Generated ${generated} thumbnails`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  try {
    // Connect to MongoDB with shorter timeout
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB");

    if (args.includes("--migrate")) {
      await migrateImages(false); // Live migration
    } else if (args.includes("--dry-run")) {
      await migrateImages(true); // Dry run
    } else if (args.includes("--thumbnails")) {
      await generateMissingThumbnails();
    } else {
      // Default: analyze only
      await analyzeImages();
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

main();
