/**
 * IMAGE URL UTILITIES
 * 
 * Handles image URLs from different sources:
 * - Old: /assets/Brochure/** (served by frontend Vite/Nginx)
 * - New: /uploads/gallery/** (served by backend Express / Nginx)
 * - External: https://...
 * 
 * PRODUCTION RULE: All paths must be ABSOLUTE from domain root (start with /)
 * NGINX serves /uploads/ directly - no hostname or API_URL needed
 */

/**
 * Resolve any image URL to correct format
 * 
 * @param {string} url - Image URL from database
 * @returns {string} - URL ready for img src (absolute path from root)
 */
export const resolveImageUrl = (url) => {
  if (!url) return '';

  // External URLs - use as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Ensure leading slash for all paths
  if (!url.startsWith('/')) {
    return `/${url}`;
  }

  // Return absolute path as-is (works for /uploads/, /assets/, etc.)
  return url;
};

// Alias for backward compatibility
export const getImageUrl = resolveImageUrl;

/**
 * Get thumbnail URL for an image
 * 
 * @param {string} url - Full image URL
 * @param {string} thumbnailUrl - Explicit thumbnail URL (for new uploads)
 * @returns {string} - Thumbnail URL or original if no thumbnail
 */
export const getThumbnailUrl = (url, thumbnailUrl) => {
  // If explicit thumbnail provided (new uploads), use it
  if (thumbnailUrl) {
    return resolveImageUrl(thumbnailUrl);
  }

  // For old /assets/ images, there's no thumbnail - use original
  return resolveImageUrl(url);
};

/**
 * Check if image is from new upload system (has thumbnail support)
 * 
 * @param {string} url - Image URL
 * @returns {boolean}
 */
export const isNewUpload = (url) => {
  return url && url.startsWith('/uploads/');
};

/**
 * Check if image is from old assets folder
 * 
 * @param {string} url - Image URL
 * @returns {boolean}
 */
export const isOldAsset = (url) => {
  return url && url.startsWith('/assets/');
};

/**
 * Generate srcSet for responsive images
 * Only works with new uploads that have thumbnails
 * 
 * @param {string} url - Full image URL
 * @param {string} thumbnailUrl - Thumbnail URL
 * @returns {string} - srcSet string or empty
 */
export const getImageSrcSet = (url, thumbnailUrl) => {
  if (!thumbnailUrl) return '';

  const thumb = resolveImageUrl(thumbnailUrl);
  const full = resolveImageUrl(url);

  // thumbnail at 400w, full at 1920w
  return `${thumb} 400w, ${full} 1920w`;
};

/**
 * Get appropriate sizes attribute for responsive loading
 * 
 * @param {"grid" | "modal" | "hero"} context - Where image is displayed
 * @returns {string} - sizes attribute value
 */
export const getImageSizes = (context) => {
  switch (context) {
    case 'grid':
      // Grid thumbnails: small on mobile, medium on larger screens
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';
    case 'modal':
      // Full screen modal
      return '100vw';
    case 'hero':
      // Hero/banner images
      return '100vw';
    default:
      return '100vw';
  }
};
