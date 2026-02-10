const multer = require("multer");
const path = require("path");

/**
 * KYC UPLOAD MIDDLEWARE
 * Handles KYC document upload validation with strict security
 * 
 * Security requirements:
 * - Only jpg, jpeg, png allowed
 * - Max 2MB per file
 * - Validates both MIME type and extension
 * - Uses memory storage for sharp processing
 */

// Allowed MIME types for KYC documents
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Validate file extension and MIME type
 */
const kycFileFilter = (req, file, cb) => {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(`Invalid file type. Only JPG, JPEG, PNG allowed. Received: ${file.mimetype}`),
      false
    );
  }

  // Validate file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(`Invalid file extension. Only .jpg, .jpeg, .png allowed. Received: ${ext}`),
      false
    );
  }

  cb(null, true);
};

// Memory storage for sharp processing
const storage = multer.memoryStorage();

/**
 * KYC documents upload middleware
 * Accepts two files: aadharFront and aadharBack
 */
exports.uploadKycDocuments = multer({
  storage,
  fileFilter: kycFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 2,
  },
}).fields([
  { name: "aadharFront", maxCount: 1 },
  { name: "aadharBack", maxCount: 1 },
]);

/**
 * Error handler for KYC upload errors
 */
exports.handleKycUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 2MB per file.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Only 2 files allowed (front and back).",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected field name. Use 'aadharFront' and 'aadharBack'.",
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
      message: err.message || "KYC upload failed",
    });
  }

  next();
};
