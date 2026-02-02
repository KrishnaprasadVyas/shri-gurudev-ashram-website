const multer = require("multer");

/**
 * UPLOAD MIDDLEWARE
 * Handles file upload validation and memory storage
 * 
 * Uses memory storage so Sharp can process images directly from buffer
 * without writing temp files to disk
 */

// Allowed MIME types for gallery images
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Max file size: 10MB per image
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// File filter to validate uploads
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`), false);
  }
};

// Memory storage for sharp processing
const storage = multer.memoryStorage();

/**
 * Single image upload middleware
 * Field name: "image"
 */
exports.uploadSingleImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single("image");

/**
 * Multiple images upload middleware
 * Field name: "images"
 * Max: 20 images at once
 */
exports.uploadMultipleImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 20,
  },
}).array("images", 20);

/**
 * Error handler for multer errors
 * Use after upload middleware
 */
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum is 20 images at once.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
  
  next();
};
