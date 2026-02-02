/**
 * IMAGE URL UTILITIES
 * 
 * Handles image URLs from different sources:
 * - Old: /assets/Brochure/** (served by frontend Vite/Nginx)
 * - New: /uploads/gallery/** (served by backend Express)
 * - External: https://...
 * 
 * This utility ensures backward compatibility while supporting new uploads.
 */

// Backend API URL (for /uploads/ paths)
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get full image URL based on source
 * 
 * @param {string} url - Image URL from database
 * @returns {string} - Full URL ready for img src
 */
export const getImageUrl = (url) => {
  if (!url) return '';

  // External URLs - use as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // New uploads from backend - prepend API URL
  if (url.startsWith('/uploads/')) {
    return `${API_URL}${url}`;
  }

  // Old assets from frontend public folder - use as-is
  // These are served directly by Vite dev server or Nginx in production
  if (url.startsWith('/assets/')) {
    return url;
  }

  // Unknown format - return as-is
  return url;
};

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
    return getImageUrl(thumbnailUrl);
  }

  // For old /assets/ images, there's no thumbnail - use original
  // The browser will load full image (existing behavior)
  return getImageUrl(url);
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

  const thumb = getImageUrl(thumbnailUrl);
  const full = getImageUrl(url);

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
