const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

/**
 * KYC SERVICE
 * Handles secure storage and retrieval of KYC documents
 * 
 * SECURITY:
 * - Files stored in private_storage/kyc/ (NOT publicly accessible)
 * - Files converted to WebP format
 * - UUID-based filenames to prevent guessing
 * - No direct file path exposure
 */

// Private storage directory (NOT served by express.static)
const PRIVATE_STORAGE_DIR = path.join(__dirname, "../../private_storage/kyc");

/**
 * Ensure private storage directory exists
 */
const ensureDirectory = () => {
  if (!fs.existsSync(PRIVATE_STORAGE_DIR)) {
    fs.mkdirSync(PRIVATE_STORAGE_DIR, { recursive: true });
    console.log("Created private KYC storage directory:", PRIVATE_STORAGE_DIR);
  }
};

// Initialize directory on module load
ensureDirectory();

/**
 * Process and save KYC document
 * Converts to WebP and saves with secure filename
 * 
 * @param {Buffer} buffer - Raw image buffer from multer
 * @param {string} userId - User ID for filename prefix
 * @returns {Promise<{fileKey: string}>} - Returns stored file key
 */
exports.saveKycDocument = async (buffer, userId) => {
  try {
    ensureDirectory();

    // Generate secure filename: kyc_<userId>_<uuid>.webp
    const uniqueId = uuidv4();
    const fileKey = `kyc_${userId}_${uniqueId}.webp`;
    const fullPath = path.join(PRIVATE_STORAGE_DIR, fileKey);

    // Convert to WebP with moderate compression
    // Keep reasonable quality for document verification
    await sharp(buffer)
      .resize(1200, null, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: 85 })
      .toFile(fullPath);

    return { fileKey };
  } catch (error) {
    console.error("KYC document processing error:", error.message);
    throw new Error("Failed to process KYC document");
  }
};

/**
 * Get full path to KYC document
 * Used internally for streaming to admin
 * 
 * @param {string} fileKey - The stored file key
 * @returns {string|null} - Full path to file or null if not found
 */
exports.getKycDocumentPath = (fileKey) => {
  if (!fileKey) return null;

  const fullPath = path.join(PRIVATE_STORAGE_DIR, fileKey);
  
  // Security: Validate fileKey doesn't contain path traversal
  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(PRIVATE_STORAGE_DIR)) {
    console.error("Path traversal attempt detected:", fileKey);
    return null;
  }

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fullPath;
};

/**
 * Delete KYC documents for a user
 * Used when application is rejected and user wants to reapply
 * 
 * @param {Array<string>} fileKeys - Array of file keys to delete
 */
exports.deleteKycDocuments = async (fileKeys) => {
  for (const fileKey of fileKeys) {
    if (!fileKey) continue;

    const fullPath = path.join(PRIVATE_STORAGE_DIR, fileKey);
    
    // Security: Validate path
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(PRIVATE_STORAGE_DIR)) {
      console.error("Path traversal attempt in delete:", fileKey);
      continue;
    }

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error("Failed to delete KYC document:", fileKey, error.message);
    }
  }
};

/**
 * Get file stats for a KYC document
 * 
 * @param {string} fileKey - The stored file key
 * @returns {Object|null} - File stats or null
 */
exports.getKycDocumentStats = (fileKey) => {
  const fullPath = exports.getKycDocumentPath(fileKey);
  if (!fullPath) return null;

  try {
    return fs.statSync(fullPath);
  } catch {
    return null;
  }
};
