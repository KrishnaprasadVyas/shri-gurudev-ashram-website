/**
 * UPDATE MONGODB URLS
 * 
 * Reads the migration mapping file and updates MongoDB with new URLs.
 * Run this after copy-gallery-images.js when database is accessible.
 * 
 * Usage: node scripts/update-mongodb-urls.js
 */

const path = require("path");
const fs = require("fs");

// Load .env from backend root
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const GalleryCategory = require("../src/models/GalleryCategory");

const MAPPING_FILE = path.join(__dirname, "../uploads/gallery/migration-mapping.json");

async function updateMongoDBUrls() {
  console.log("\n🔄 UPDATE MONGODB URLs\n");
  console.log("━".repeat(50));
  
  // Check if mapping file exists
  if (!fs.existsSync(MAPPING_FILE)) {
    console.log("❌ Mapping file not found!");
    console.log("   Run copy-gallery-images.js first.\n");
    return;
  }
  
  // Load mapping data
  const mappingData = JSON.parse(fs.readFileSync(MAPPING_FILE, "utf-8"));
  console.log(`\n📄 Loaded mapping from: ${mappingData.createdAt}`);
  console.log(`   Categories: ${mappingData.categories.length}`);
  console.log(`   Images: ${mappingData.successCount}\n`);
  
  // Connect to MongoDB
  console.log("⏳ Connecting to MongoDB...");
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    console.log("✅ Connected to MongoDB\n");
  } catch (error) {
    console.log("❌ MongoDB connection failed:", error.message);
    console.log("   Please check your network and try again.\n");
    return;
  }
  
  console.log("━".repeat(50));
  
  let updatedCategories = 0;
  let createdCategories = 0;
  
  for (const catData of mappingData.categories) {
    console.log(`\n📂 ${catData.name} (${catData.images.length} images)`);
    
    try {
      // Find existing category by slug
      let category = await GalleryCategory.findOne({ slug: catData.slug });
      
      if (category) {
        // Update existing - replace images with new URLs
        category.images = catData.images.map((img, index) => ({
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          title: img.title,
          altText: img.altText,
          order: index,
          isVisible: true,
        }));
        category.coverImageUrl = catData.coverImageUrl;
        await category.save();
        console.log(`   ✅ Updated existing category`);
        updatedCategories++;
      } else {
        // Create new category
        category = new GalleryCategory({
          name: catData.name,
          slug: catData.slug,
          description: `${catData.name} gallery images`,
          coverImageUrl: catData.coverImageUrl,
          images: catData.images.map((img, index) => ({
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            title: img.title,
            altText: img.altText,
            order: index,
            isVisible: true,
          })),
          order: mappingData.categories.indexOf(catData),
          isVisible: true,
        });
        await category.save();
        console.log(`   ✅ Created new category`);
        createdCategories++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Disconnect
  await mongoose.disconnect();
  
  // Summary
  console.log("\n" + "━".repeat(50));
  console.log("\n📊 Summary:\n");
  console.log(`   Updated: ${updatedCategories}`);
  console.log(`   Created: ${createdCategories}`);
  console.log("\n✨ MongoDB URLs updated!\n");
}

updateMongoDBUrls().catch(console.error);
