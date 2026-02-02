const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

/**
 * IMAGE SERVICE
 * Handles image processing and optimization for gallery uploads
 * 
 * STRATEGY:
 * - Original images saved as optimized WebP (max 1920px width)
 * - Thumbnails generated at 400px width for fast grid loading
 * - All images served from /uploads/gallery/
 * - Old images from /assets/Brochure/ continue to work (served by frontend)
 */

// Upload directories
const UPLOAD_DIR = path.join(__dirname, "../../uploads/gallery");
const THUMBNAIL_DIR = path.join(__dirname, "../../uploads/gallery/thumbnails");

// Ensure directories exist
const ensureDirectories = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
  }
};

// Initialize directories on module load
ensureDirectories();

/**
 * Process and save uploaded image
 * Creates both full-size optimized image and thumbnail
 * 
 * @param {Buffer} buffer - Raw image buffer from multer
 * @param {string} originalName - Original filename for reference
 * @returns {Promise<{url: string, thumbnailUrl: string, width: number, height: number}>}
 */
exports.processAndSaveImage = async (buffer, originalName) => {
  try {
    ensureDirectories();

    // Generate unique filename
    const uniqueId = uuidv4();
    const filename = `${uniqueId}.webp`;
    const thumbnailFilename = `thumb_${uniqueId}.webp`;

    const fullPath = path.join(UPLOAD_DIR, filename);
    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);

    // Get image metadata first
    const metadata = await sharp(buffer).metadata();

    // Process full-size image (max 1920px width, WebP format, 80% quality)
    await sharp(buffer)
      .resize(1920, null, {
        withoutEnlargement: true, // Don't upscale small images
        fit: "inside",
      })
      .webp({ quality: 80 })
      .toFile(fullPath);

    // Generate thumbnail (400px width for grid view)
    await sharp(buffer)
      .resize(400, 300, {
        fit: "cover", // Crop to fill for consistent grid
        position: "center",
      })
      .webp({ quality: 70 })
      .toFile(thumbnailPath);

    // Return public URLs (relative to backend root)
    return {
      url: `/uploads/gallery/${filename}`,
      thumbnailUrl: `/uploads/gallery/thumbnails/${thumbnailFilename}`,
      width: metadata.width,
      height: metadata.height,
      originalName: originalName,
    };
  } catch (error) {
    console.error("Image processing error:", error.message);
    throw new Error("Failed to process image");
  }
};

/**
 * Process multiple images in batch
 * 
 * @param {Array<{buffer: Buffer, originalname: string}>} files - Array of multer files
 * @returns {Promise<Array>} - Array of processed image data
 */
exports.processMultipleImages = async (files) => {
  const results = [];
  
  for (const file of files) {
    try {
      const result = await exports.processAndSaveImage(file.buffer, file.originalname);
      results.push({
        success: true,
        ...result,
      });
    } catch (error) {
      results.push({
        success: false,
        originalName: file.originalname,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Delete image and its thumbnail
 * 
 * @param {string} imageUrl - URL like /uploads/gallery/xyz.webp
 * @returns {Promise<boolean>}
 */
exports.deleteImage = async (imageUrl) => {
  try {
    // Only delete images from uploads directory (not old /assets/ images)
    if (!imageUrl || !imageUrl.startsWith("/uploads/gallery/")) {
      return false;
    }

    const filename = path.basename(imageUrl);
    const fullPath = path.join(UPLOAD_DIR, filename);
    const thumbnailPath = path.join(THUMBNAIL_DIR, `thumb_${filename}`);

    // Delete main image
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete thumbnail
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    return true;
  } catch (error) {
    console.error("Image deletion error:", error.message);
    return false;
  }
};

/**
 * Get thumbnail URL for any image URL
 * Handles both old /assets/ URLs and new /uploads/ URLs
 * 
 * @param {string} imageUrl - Original image URL
 * @returns {string} - Thumbnail URL or original if no thumbnail exists
 */
exports.getThumbnailUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // New uploads have dedicated thumbnails
  if (imageUrl.startsWith("/uploads/gallery/") && !imageUrl.includes("/thumbnails/")) {
    const filename = path.basename(imageUrl);
    return `/uploads/gallery/thumbnails/thumb_${filename}`;
  }

  // Old /assets/ images don't have thumbnails - return original
  // Frontend will handle lazy loading for these
  return imageUrl;
};

/**
 * Check if URL is a new upload or old asset
 * 
 * @param {string} url - Image URL
 * @returns {"upload" | "asset" | "external"}
 */
exports.getImageSource = (url) => {
  if (!url) return null;
  if (url.startsWith("/uploads/")) return "upload";
  if (url.startsWith("/assets/")) return "asset";
  if (url.startsWith("http")) return "external";
  return "unknown";
};
