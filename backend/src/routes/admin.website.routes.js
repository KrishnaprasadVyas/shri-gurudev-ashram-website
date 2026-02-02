const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize");
const validateObjectId = require("../middlewares/validateObjectId");
const {
  uploadSingleImage,
  uploadMultipleImages,
  handleUploadError,
} = require("../middlewares/upload.middleware");

/**
 * ADMIN WEBSITE ROUTES
 * Protected routes for WEBSITE_ADMIN and SYSTEM_ADMIN roles
 * Handles all content management operations
 */

// Import controllers
const announcementController = require("../controllers/announcement.controller");
const activityController = require("../controllers/activity.controller");
const eventController = require("../controllers/event.controller");
const testimonialController = require("../controllers/testimonial.controller");
const donationHeadController = require("../controllers/donationHead.controller");
const galleryController = require("../controllers/gallery.controller");
const productController = require("../controllers/product.controller");

// All routes require auth and WEBSITE_ADMIN or SYSTEM_ADMIN role
const adminAuth = [auth, authorize("WEBSITE_ADMIN", "SYSTEM_ADMIN")];

// Helper: Add ObjectId validation to adminAuth for routes with :id param
const adminAuthWithId = [...adminAuth, validateObjectId("id")];

// ==================== ANNOUNCEMENTS ====================

router.get(
  "/announcements",
  adminAuth,
  announcementController.getAllAnnouncements,
);
router.get(
  "/announcements/:id",
  adminAuthWithId,
  announcementController.getAnnouncementById,
);
router.post(
  "/announcements",
  adminAuth,
  announcementController.createAnnouncement,
);
router.put(
  "/announcements/:id",
  adminAuthWithId,
  announcementController.updateAnnouncement,
);
router.delete(
  "/announcements/:id",
  adminAuthWithId,
  announcementController.deleteAnnouncement,
);
router.patch(
  "/announcements/:id/toggle",
  adminAuthWithId,
  announcementController.toggleAnnouncementStatus,
);

// ==================== ACTIVITIES ====================

router.get("/activities", adminAuth, activityController.getAllActivities);
router.get("/activities/:id", adminAuthWithId, activityController.getActivityById);
router.post("/activities", adminAuth, activityController.createActivity);
router.put("/activities/:id", adminAuthWithId, activityController.updateActivity);
router.delete("/activities/:id", adminAuthWithId, activityController.deleteActivity);
router.patch(
  "/activities/:id/toggle",
  adminAuthWithId,
  activityController.toggleActivityVisibility,
);
router.put(
  "/activities/reorder",
  adminAuth,
  activityController.reorderActivities,
);

// Activity image upload
router.post(
  "/activities/upload",
  adminAuth,
  uploadSingleImage,
  handleUploadError,
  activityController.uploadImage,
);

// Activity subitems
router.post(
  "/activities/:id/subitems",
  adminAuthWithId,
  activityController.addSubitem,
);
router.put(
  "/activities/:id/subitems/:subitemId",
  adminAuthWithId,
  activityController.updateSubitem,
);
router.delete(
  "/activities/:id/subitems/:subitemId",
  adminAuthWithId,
  activityController.deleteSubitem,
);

// ==================== EVENTS ====================

router.get("/events", adminAuth, eventController.getAllEvents);
router.get("/events/:id", adminAuthWithId, eventController.getEventById);
router.post("/events", adminAuth, eventController.createEvent);
router.put("/events/:id", adminAuthWithId, eventController.updateEvent);
router.delete("/events/:id", adminAuthWithId, eventController.deleteEvent);
router.patch(
  "/events/:id/publish",
  adminAuthWithId,
  eventController.toggleEventPublish,
);
router.patch(
  "/events/:id/feature",
  adminAuthWithId,
  eventController.toggleEventFeatured,
);
router.post(
  "/events/update-status",
  adminAuth,
  eventController.updateEventStatuses,
);

// Event image upload
router.post(
  "/events/upload",
  adminAuth,
  uploadSingleImage,
  handleUploadError,
  eventController.uploadImage,
);

// ==================== TESTIMONIALS ====================

router.get(
  "/testimonials",
  adminAuth,
  testimonialController.getAllTestimonials,
);
router.get(
  "/testimonials/pending",
  adminAuth,
  testimonialController.getPendingTestimonials,
);
router.get(
  "/testimonials/:id",
  adminAuthWithId,
  testimonialController.getTestimonialById,
);
router.post(
  "/testimonials",
  adminAuth,
  testimonialController.createTestimonial,
);
router.put(
  "/testimonials/:id",
  adminAuthWithId,
  testimonialController.updateTestimonial,
);
router.delete(
  "/testimonials/:id",
  adminAuthWithId,
  testimonialController.deleteTestimonial,
);
router.patch(
  "/testimonials/:id/toggle",
  adminAuthWithId,
  testimonialController.toggleTestimonialApproval,
);
router.patch(
  "/testimonials/:id/approve",
  adminAuthWithId,
  testimonialController.approveTestimonial,
);
router.patch(
  "/testimonials/:id/reject",
  adminAuthWithId,
  testimonialController.rejectTestimonial,
);
router.patch(
  "/testimonials/:id/feature",
  adminAuthWithId,
  testimonialController.toggleTestimonialFeatured,
);
router.put(
  "/testimonials/reorder",
  adminAuth,
  testimonialController.reorderTestimonials,
);

// ==================== DONATION HEADS / CAUSES ====================

router.get(
  "/donation-heads",
  adminAuth,
  donationHeadController.getAllDonationHeads,
);
router.get(
  "/donation-heads/:id",
  adminAuthWithId,
  donationHeadController.getDonationHeadById,
);
router.post(
  "/donation-heads",
  adminAuth,
  donationHeadController.createDonationHead,
);
router.put(
  "/donation-heads/:id",
  adminAuthWithId,
  donationHeadController.updateDonationHead,
);
router.delete(
  "/donation-heads/:id",
  adminAuthWithId,
  donationHeadController.deleteDonationHead,
);
router.patch(
  "/donation-heads/:id/toggle",
  adminAuthWithId,
  donationHeadController.toggleDonationHeadStatus,
);
router.put(
  "/donation-heads/reorder",
  adminAuth,
  donationHeadController.reorderDonationHeads,
);

// Donation head sub-causes
router.post(
  "/donation-heads/:id/sub-causes",
  adminAuthWithId,
  donationHeadController.addSubCause,
);
router.delete(
  "/donation-heads/:id/sub-causes/:subCauseId",
  adminAuthWithId,
  donationHeadController.deleteSubCause,
);

// ==================== GALLERY ====================

router.get("/gallery", adminAuth, galleryController.getAllGalleryCategories);
router.get("/gallery/:id", adminAuthWithId, galleryController.getGalleryCategoryById);
router.post("/gallery", adminAuth, galleryController.createGalleryCategory);
router.put("/gallery/:id", adminAuthWithId, galleryController.updateGalleryCategory);
router.delete(
  "/gallery/:id",
  adminAuthWithId,
  galleryController.deleteGalleryCategory,
);
router.patch(
  "/gallery/:id/toggle",
  adminAuthWithId,
  galleryController.toggleGalleryCategoryVisibility,
);
router.put(
  "/gallery/reorder",
  adminAuth,
  galleryController.reorderGalleryCategories,
);

// Gallery image upload routes (NEW - for file uploads instead of URLs)
router.post(
  "/gallery/upload",
  adminAuth,
  uploadSingleImage,
  handleUploadError,
  galleryController.uploadSingleImage,
);
router.post(
  "/gallery/upload/multiple",
  adminAuth,
  uploadMultipleImages,
  handleUploadError,
  galleryController.uploadMultipleImages,
);
router.post(
  "/gallery/:id/upload",
  adminAuthWithId,
  uploadMultipleImages,
  handleUploadError,
  galleryController.uploadImagesToCategory,
);

// Gallery images management
router.post(
  "/gallery/:id/images",
  adminAuthWithId,
  galleryController.addImagesToGalleryCategory,
);
router.put(
  "/gallery/:id/images/:imageId",
  adminAuthWithId,
  galleryController.updateGalleryImage,
);
router.delete(
  "/gallery/:id/images/:imageId",
  adminAuthWithId,
  galleryController.deleteGalleryImage,
);
// Delete image with file cleanup (for uploaded images)
router.delete(
  "/gallery/:id/images/:imageId/file",
  adminAuthWithId,
  galleryController.deleteGalleryImageWithFile,
);
router.put(
  "/gallery/:id/images/reorder",
  adminAuthWithId,
  galleryController.reorderGalleryImages,
);

// ==================== PRODUCTS (Shop) ====================

router.get("/products", adminAuth, productController.getAllProducts);
router.get(
  "/products/categories",
  adminAuth,
  productController.getAllCategories,
);
router.get("/products/:id", adminAuthWithId, productController.getProductById);
router.post("/products", adminAuth, productController.createProduct);
router.put("/products/:id", adminAuthWithId, productController.updateProduct);
router.delete("/products/:id", adminAuthWithId, productController.deleteProduct);
router.patch(
  "/products/:id/toggle",
  adminAuthWithId,
  productController.toggleProductStatus,
);
router.patch(
  "/products/:id/stock",
  adminAuthWithId,
  productController.updateProductStock,
);

// Product categories
router.post(
  "/products/categories",
  adminAuth,
  productController.createCategory,
);
router.put(
  "/products/categories/:id",
  adminAuthWithId,
  productController.updateCategory,
);
router.delete(
  "/products/categories/:id",
  adminAuthWithId,
  productController.deleteCategory,
);

module.exports = router;
