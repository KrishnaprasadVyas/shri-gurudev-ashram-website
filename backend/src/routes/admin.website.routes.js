const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize");

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
const galleryController = require("../controllers/galleryNew.controller");
const brochureController = require("../controllers/brochure.controller");
const productController = require("../controllers/product.controller");

// All routes require auth and WEBSITE_ADMIN or SYSTEM_ADMIN role
const adminAuth = [auth, authorize("WEBSITE_ADMIN", "SYSTEM_ADMIN")];

// ==================== ANNOUNCEMENTS ====================

router.get("/announcements", adminAuth, announcementController.getAllAnnouncements);
router.get("/announcements/:id", adminAuth, announcementController.getAnnouncementById);
router.post("/announcements", adminAuth, announcementController.createAnnouncement);
router.put("/announcements/:id", adminAuth, announcementController.updateAnnouncement);
router.delete("/announcements/:id", adminAuth, announcementController.deleteAnnouncement);
router.patch("/announcements/:id/toggle", adminAuth, announcementController.toggleAnnouncementStatus);

// ==================== ACTIVITIES ====================

router.get("/activities", adminAuth, activityController.getAllActivities);
router.get("/activities/:id", adminAuth, activityController.getActivityById);
router.post("/activities", adminAuth, activityController.createActivity);
router.put("/activities/:id", adminAuth, activityController.updateActivity);
router.delete("/activities/:id", adminAuth, activityController.deleteActivity);
router.patch("/activities/:id/toggle", adminAuth, activityController.toggleActivityVisibility);
router.put("/activities/reorder", adminAuth, activityController.reorderActivities);

// Activity subitems
router.post("/activities/:id/subitems", adminAuth, activityController.addSubitem);
router.put("/activities/:id/subitems/:subitemId", adminAuth, activityController.updateSubitem);
router.delete("/activities/:id/subitems/:subitemId", adminAuth, activityController.deleteSubitem);

// ==================== EVENTS ====================

router.get("/events", adminAuth, eventController.getAllEvents);
router.get("/events/:id", adminAuth, eventController.getEventById);
router.post("/events", adminAuth, eventController.createEvent);
router.put("/events/:id", adminAuth, eventController.updateEvent);
router.delete("/events/:id", adminAuth, eventController.deleteEvent);
router.patch("/events/:id/publish", adminAuth, eventController.toggleEventPublish);
router.patch("/events/:id/feature", adminAuth, eventController.toggleEventFeatured);
router.post("/events/update-status", adminAuth, eventController.updateEventStatuses);

// ==================== TESTIMONIALS ====================

router.get("/testimonials", adminAuth, testimonialController.getAllTestimonials);
router.get("/testimonials/pending", adminAuth, testimonialController.getPendingTestimonials);
router.get("/testimonials/:id", adminAuth, testimonialController.getTestimonialById);
router.post("/testimonials", adminAuth, testimonialController.createTestimonial);
router.put("/testimonials/:id", adminAuth, testimonialController.updateTestimonial);
router.delete("/testimonials/:id", adminAuth, testimonialController.deleteTestimonial);
router.patch("/testimonials/:id/approve", adminAuth, testimonialController.approveTestimonial);
router.patch("/testimonials/:id/reject", adminAuth, testimonialController.rejectTestimonial);
router.patch("/testimonials/:id/feature", adminAuth, testimonialController.toggleTestimonialFeatured);
router.put("/testimonials/reorder", adminAuth, testimonialController.reorderTestimonials);

// ==================== DONATION HEADS / CAUSES ====================

router.get("/donation-heads", adminAuth, donationHeadController.getAllDonationHeads);
router.get("/donation-heads/:id", adminAuth, donationHeadController.getDonationHeadById);
router.post("/donation-heads", adminAuth, donationHeadController.createDonationHead);
router.put("/donation-heads/:id", adminAuth, donationHeadController.updateDonationHead);
router.delete("/donation-heads/:id", adminAuth, donationHeadController.deleteDonationHead);
router.patch("/donation-heads/:id/toggle", adminAuth, donationHeadController.toggleDonationHeadStatus);
router.put("/donation-heads/reorder", adminAuth, donationHeadController.reorderDonationHeads);

// Donation head sub-causes
router.post("/donation-heads/:id/sub-causes", adminAuth, donationHeadController.addSubCause);
router.delete("/donation-heads/:id/sub-causes/:subCauseId", adminAuth, donationHeadController.deleteSubCause);

// ==================== GALLERY ====================

router.get("/gallery", adminAuth, galleryController.getAllGalleryImages);
router.get("/gallery/categories", adminAuth, galleryController.getAllCategories);
router.get("/gallery/:id", adminAuth, galleryController.getGalleryImageById);
router.post("/gallery", adminAuth, galleryController.createGalleryItem);
router.post("/gallery/bulk", adminAuth, galleryController.bulkCreateGalleryItems);
router.put("/gallery/:id", adminAuth, galleryController.updateGalleryItem);
router.delete("/gallery/:id", adminAuth, galleryController.deleteGalleryItem);
router.patch("/gallery/:id/toggle", adminAuth, galleryController.toggleGalleryVisibility);
router.put("/gallery/reorder", adminAuth, galleryController.reorderGalleryImages);

// Gallery categories
router.post("/gallery/categories", adminAuth, galleryController.createCategory);
router.put("/gallery/categories/:id", adminAuth, galleryController.updateCategory);
router.delete("/gallery/categories/:id", adminAuth, galleryController.deleteCategory);

// ==================== BROCHURE (Folder-based Gallery) ====================

router.get("/brochure", adminAuth, brochureController.getAllBrochureCategories);
router.get("/brochure/:id", adminAuth, brochureController.getBrochureCategoryById);
router.post("/brochure", adminAuth, brochureController.createBrochureCategory);
router.put("/brochure/:id", adminAuth, brochureController.updateBrochureCategory);
router.delete("/brochure/:id", adminAuth, brochureController.deleteBrochureCategory);
router.patch("/brochure/:id/toggle", adminAuth, brochureController.toggleBrochureCategoryVisibility);
router.put("/brochure/reorder", adminAuth, brochureController.reorderBrochureCategories);

// Brochure images management
router.post("/brochure/:id/images", adminAuth, brochureController.addImagesToBrochureCategory);
router.put("/brochure/:id/images/:imageId", adminAuth, brochureController.updateBrochureImage);
router.delete("/brochure/:id/images/:imageId", adminAuth, brochureController.deleteBrochureImage);
router.put("/brochure/:id/images/reorder", adminAuth, brochureController.reorderBrochureImages);

// ==================== PRODUCTS (Shop) ====================

router.get("/products", adminAuth, productController.getAllProducts);
router.get("/products/categories", adminAuth, productController.getAllCategories);
router.get("/products/:id", adminAuth, productController.getProductById);
router.post("/products", adminAuth, productController.createProduct);
router.put("/products/:id", adminAuth, productController.updateProduct);
router.delete("/products/:id", adminAuth, productController.deleteProduct);
router.patch("/products/:id/toggle", adminAuth, productController.toggleProductStatus);
router.patch("/products/:id/stock", adminAuth, productController.updateProductStock);

// Product categories
router.post("/products/categories", adminAuth, productController.createCategory);
router.put("/products/categories/:id", adminAuth, productController.updateCategory);
router.delete("/products/categories/:id", adminAuth, productController.deleteCategory);

module.exports = router;
