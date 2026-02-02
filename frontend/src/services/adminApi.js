/**
 * Admin API Service
 * Handles all API calls for admin panel operations
 */

import { API_BASE_URL, getAuthToken, parseJsonResponse } from '../utils/api';

/**
 * Create headers with auth token
 */
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getAuthToken()}`,
});

/**
 * Generic API request handler with proper error handling
 */
const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
};

// ==================== ANNOUNCEMENTS ====================

export const announcementsApi = {
  // Get all announcements (admin)
  getAll: () => apiRequest("/admin/website/announcements"),

  // Get single announcement
  getById: (id) => apiRequest(`/admin/website/announcements/${id}`),

  // Create announcement
  create: (data) =>
    apiRequest("/admin/website/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update announcement
  update: (id, data) =>
    apiRequest(`/admin/website/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete announcement
  delete: (id) =>
    apiRequest(`/admin/website/announcements/${id}`, {
      method: "DELETE",
    }),

  // Toggle announcement status
  toggle: (id) =>
    apiRequest(`/admin/website/announcements/${id}/toggle`, {
      method: "PATCH",
    }),

  // Get active announcements (public)
  getActive: () => apiRequest("/public/announcements"),
};

// ==================== ACTIVITIES ====================

export const activitiesApi = {
  // Get all activities (admin)
  getAll: () => apiRequest("/admin/website/activities"),

  // Get single activity
  getById: (id) => apiRequest(`/admin/website/activities/${id}`),

  // Create activity
  create: (data) =>
    apiRequest("/admin/website/activities", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update activity
  update: (id, data) =>
    apiRequest(`/admin/website/activities/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete activity
  delete: (id) =>
    apiRequest(`/admin/website/activities/${id}`, {
      method: "DELETE",
    }),

  // Toggle visibility
  toggle: (id) =>
    apiRequest(`/admin/website/activities/${id}/toggle`, {
      method: "PATCH",
    }),

  // Reorder activities
  reorder: (orderedIds) =>
    apiRequest("/admin/website/activities/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    }),

  // Upload activity image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/admin/website/activities/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }
    return data;
  },

  // Get visible activities (public)
  getVisible: () => apiRequest("/public/activities"),
};

// ==================== EVENTS ====================

export const eventsApi = {
  // Get all events (admin)
  getAll: () => apiRequest("/admin/website/events"),

  // Get single event
  getById: (id) => apiRequest(`/admin/website/events/${id}`),

  // Create event
  create: (data) =>
    apiRequest("/admin/website/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update event
  update: (id, data) =>
    apiRequest(`/admin/website/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete event
  delete: (id) =>
    apiRequest(`/admin/website/events/${id}`, {
      method: "DELETE",
    }),

  // Toggle publish status
  togglePublish: (id) =>
    apiRequest(`/admin/website/events/${id}/publish`, {
      method: "PATCH",
    }),

  // Toggle featured status
  toggleFeatured: (id) =>
    apiRequest(`/admin/website/events/${id}/feature`, {
      method: "PATCH",
    }),

  // Upload event image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/admin/website/events/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }
    return data;
  },

  // Get published events (public)
  getPublished: () => apiRequest("/public/events"),
};

// ==================== TESTIMONIALS ====================

export const testimonialsApi = {
  // Get all testimonials (admin)
  getAll: () => apiRequest("/admin/website/testimonials"),

  // Get pending testimonials
  getPending: () => apiRequest("/admin/website/testimonials/pending"),

  // Get single testimonial
  getById: (id) => apiRequest(`/admin/website/testimonials/${id}`),

  // Create testimonial
  create: (data) =>
    apiRequest("/admin/website/testimonials", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update testimonial
  update: (id, data) =>
    apiRequest(`/admin/website/testimonials/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete testimonial
  delete: (id) =>
    apiRequest(`/admin/website/testimonials/${id}`, {
      method: "DELETE",
    }),

  // Toggle approval status
  toggle: (id) =>
    apiRequest(`/admin/website/testimonials/${id}/toggle`, {
      method: "PATCH",
    }),

  // Approve testimonial
  approve: (id) =>
    apiRequest(`/admin/website/testimonials/${id}/approve`, {
      method: "PATCH",
    }),

  // Reject testimonial
  reject: (id) =>
    apiRequest(`/admin/website/testimonials/${id}/reject`, {
      method: "PATCH",
    }),

  // Toggle featured
  toggleFeatured: (id) =>
    apiRequest(`/admin/website/testimonials/${id}/feature`, {
      method: "PATCH",
    }),

  // Reorder testimonials
  reorder: (orderedIds) =>
    apiRequest("/admin/website/testimonials/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    }),

  // Get approved testimonials (public)
  getApproved: () => apiRequest("/public/testimonials"),
};

// ==================== GALLERY ====================

export const galleryApi = {
  // Get all gallery categories (admin)
  getAll: () => apiRequest("/admin/website/gallery"),

  // Get single category
  getById: (id) => apiRequest(`/admin/website/gallery/${id}`),

  // Create category
  create: (data) =>
    apiRequest("/admin/website/gallery", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update category
  update: (id, data) =>
    apiRequest(`/admin/website/gallery/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete category
  delete: (id) =>
    apiRequest(`/admin/website/gallery/${id}`, {
      method: "DELETE",
    }),

  // Toggle visibility
  toggle: (id) =>
    apiRequest(`/admin/website/gallery/${id}/toggle`, {
      method: "PATCH",
    }),

  // Reorder categories
  reorder: (orderedIds) =>
    apiRequest("/admin/website/gallery/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    }),

  // ==================== IMAGE UPLOAD (NEW) ====================

  /**
   * Upload single image file
   * Returns { url, thumbnailUrl, originalName }
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/admin/website/gallery/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        // Note: Don't set Content-Type for FormData - browser sets it with boundary
      },
      body: formData,
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }
    return data;
  },

  /**
   * Upload multiple image files
   * Returns { uploaded: [...], failed: [...] }
   */
  uploadImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const response = await fetch(`${API_BASE_URL}/admin/website/gallery/upload/multiple`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }
    return data;
  },

  /**
   * Upload images directly to a category
   * Combines upload + add to category in one request
   */
  uploadToCategory: async (categoryId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const response = await fetch(`${API_BASE_URL}/admin/website/gallery/${categoryId}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }
    return data;
  },

  // ==================== IMAGE MANAGEMENT ====================

  // Add images to category (by URL - for backward compatibility)
  addImages: (categoryId, images) =>
    apiRequest(`/admin/website/gallery/${categoryId}/images`, {
      method: "POST",
      body: JSON.stringify({ images }),
    }),

  // Update image
  updateImage: (categoryId, imageId, data) =>
    apiRequest(`/admin/website/gallery/${categoryId}/images/${imageId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete image (keeps file for old /assets/ images)
  deleteImage: (categoryId, imageId) =>
    apiRequest(`/admin/website/gallery/${categoryId}/images/${imageId}`, {
      method: "DELETE",
    }),

  // Delete image with file cleanup (for uploaded images)
  deleteImageWithFile: (categoryId, imageId) =>
    apiRequest(`/admin/website/gallery/${categoryId}/images/${imageId}/file`, {
      method: "DELETE",
    }),

  // Reorder images
  reorderImages: (categoryId, orderedIds) =>
    apiRequest(`/admin/website/gallery/${categoryId}/images/reorder`, {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    }),

  // Get visible categories (public)
  getVisible: () => apiRequest("/public/gallery"),

  // Get all images flattened (public)
  getAllImages: () => apiRequest("/public/gallery/all-images"),
};

// ==================== DONATION HEADS ====================

export const donationHeadsApi = {
  // Get all donation heads (admin)
  getAll: () => apiRequest("/admin/website/donation-heads"),

  // Get single donation head
  getById: (id) => apiRequest(`/admin/website/donation-heads/${id}`),

  // Create donation head
  create: (data) =>
    apiRequest("/admin/website/donation-heads", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update donation head
  update: (id, data) =>
    apiRequest(`/admin/website/donation-heads/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete donation head
  delete: (id) =>
    apiRequest(`/admin/website/donation-heads/${id}`, {
      method: "DELETE",
    }),

  // Toggle status
  toggle: (id) =>
    apiRequest(`/admin/website/donation-heads/${id}/toggle`, {
      method: "PATCH",
    }),

  // Reorder
  reorder: (orderedIds) =>
    apiRequest("/admin/website/donation-heads/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    }),

  // Get active donation heads (public)
  getActive: () => apiRequest("/public/donation-heads"),
};

export default {
  announcements: announcementsApi,
  activities: activitiesApi,
  events: eventsApi,
  testimonials: testimonialsApi,
  gallery: galleryApi,
  donationHeads: donationHeadsApi,
};
