/**
 * COPY GALLERY IMAGES (Offline - No MongoDB)
 * 
 * Copies and processes images from frontend/public/assets/Brochure to backend/uploads/gallery
 * Creates a mapping file that can be used to update MongoDB later.
 * 
 * Usage: node scripts/copy-gallery-images.js
 */

const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

// Paths
const FRONTEND_BROCHURE_PATH = path.join(__dirname, "../../frontend/public/assets/Brochure");
const UPLOAD_DIR = path.join(__dirname, "../uploads/gallery");
const THUMBNAIL_DIR = path.join(__dirname, "../uploads/gallery/thumbnails");
const MAPPING_FILE = path.join(__dirname, "../uploads/gallery/migration-mapping.json");

// Ensure directories exist
const ensureDirectories = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
  }
};

/**
 * Process and save a single image
 */
const processImage = async (sourcePath, originalName) => {
  try {
    const buffer = fs.readFileSync(sourcePath);
    
    // Generate unique filename
    const uniqueId = uuidv4();
    const filename = `${uniqueId}.webp`;
    const thumbnailFilename = `thumb_${uniqueId}.webp`;

    const fullPath = path.join(UPLOAD_DIR, filename);
    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);

    // Process full-size image (max 1920px width, WebP format, 80% quality)
    await sharp(buffer)
      .resize(1920, null, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: 80 })
      .toFile(fullPath);

    // Generate thumbnail (400px width for grid view)
    await sharp(buffer)
      .resize(400, 300, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 70 })
      .toFile(thumbnailPath);

    return {
      success: true,
      url: `/uploads/gallery/${filename}`,
      thumbnailUrl: `/uploads/gallery/thumbnails/${thumbnailFilename}`,
      originalName,
    };
  } catch (error) {
    return {
      success: false,
      originalName,
      error: error.message,
    };
  }
};

/**
 * Get all image files from a directory
 */
const getImageFiles = (dirPath) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  
  try {
    const files = fs.readdirSync(dirPath);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return allowedExtensions.includes(ext);
    });
  } catch (error) {
    return [];
  }
};

/**
 * Create slug from folder name
 */
const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

/**
 * Main function
 */
const copyGalleryImages = async () => {
  console.log("\n🚀 COPY GALLERY IMAGES (Offline Mode)\n");
  console.log("━".repeat(50));
  
  ensureDirectories();
  
  // Get all folders in Brochure directory
  const folders = fs.readdirSync(FRONTEND_BROCHURE_PATH).filter(item => {
    const itemPath = path.join(FRONTEND_BROCHURE_PATH, item);
    return fs.statSync(itemPath).isDirectory();
  });
  
  console.log(`\n📁 Found ${folders.length} folders:\n`);
  folders.forEach(f => console.log(`   • ${f}`));
  console.log("\n" + "━".repeat(50));
  
  const mapping = {}; // oldUrl -> newUrl mapping
  const categoryData = []; // Data for MongoDB updates
  
  let totalImages = 0;
  let successCount = 0;
  let failCount = 0;
  
  for (const folder of folders) {
    const folderPath = path.join(FRONTEND_BROCHURE_PATH, folder);
    const imageFiles = getImageFiles(folderPath);
    
    console.log(`\n📂 ${folder} (${imageFiles.length} images)`);
    
    if (imageFiles.length === 0) {
      console.log("   ⚠️  No images found");
      continue;
    }
    
    const slug = createSlug(folder);
    const processedImages = [];
    
    for (const imageFile of imageFiles) {
      const sourcePath = path.join(folderPath, imageFile);
      const oldUrl = `/assets/Brochure/${folder}/${imageFile}`;
      
      process.stdout.write(`   📷 ${imageFile}... `);
      
      const result = await processImage(sourcePath, imageFile);
      totalImages++;
      
      if (result.success) {
        successCount++;
        mapping[oldUrl] = {
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
        };
        processedImages.push({
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          title: path.basename(imageFile, path.extname(imageFile)),
          altText: `${folder} - ${imageFile}`,
          oldUrl: oldUrl,
        });
        console.log(`✅`);
      } else {
        failCount++;
        console.log(`❌ ${result.error}`);
      }
    }
    
    categoryData.push({
      name: folder,
      slug: slug,
      images: processedImages,
      coverImageUrl: processedImages[0]?.url || null,
    });
  }
  
  // Save mapping file
  const mappingData = {
    createdAt: new Date().toISOString(),
    totalImages,
    successCount,
    failCount,
    mapping,
    categories: categoryData,
  };
  
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mappingData, null, 2));
  
  // Print summary
  console.log("\n" + "━".repeat(50));
  console.log("\n📊 Summary:\n");
  console.log(`   Total: ${totalImages}`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`\n📄 Mapping saved to: uploads/gallery/migration-mapping.json`);
  console.log("\n✨ Done! Run update-mongodb-urls.js when database is accessible.\n");
};

copyGalleryImages().catch(console.error);
