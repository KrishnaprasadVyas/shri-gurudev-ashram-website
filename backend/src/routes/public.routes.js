const express = require("express");
const router = express.Router();

/**
 * PUBLIC ROUTES
 * No authentication required - safe for public consumption
 * All routes are GET only (except testimonial submission)
 */

// Import controllers
const {
  getRecentDonations,
  getTopDonors,
  validateReferralCode,
} = require("../controllers/public.controller");

const announcementController = require("../controllers/announcement.controller");
const activityController = require("../controllers/activity.controller");
const eventController = require("../controllers/event.controller");
const testimonialController = require("../controllers/testimonial.controller");
const donationHeadController = require("../controllers/donationHead.controller");
const galleryController = require("../controllers/gallery.controller");
const productController = require("../controllers/product.controller");

// Optional auth middleware for authenticated public submissions
const optionalAuth = require("../middlewares/optionalAuth.middleware");

// FIX 2: Rate limiter to prevent brute-force referral code guessing
const { publicApiLimiter } = require("../middlewares/rateLimit");

// ==================== DONATION DATA ====================

// GET /api/public/donations/recent - Last 10 successful donations
router.get("/donations/recent", getRecentDonations);

// GET /api/public/donations/top - Top 5 donors by total amount
router.get("/donations/top", getTopDonors);

// ==================== REFERRAL ====================

// GET /api/public/referral/:code - Validate referral code and get collector name
// FIX 2: Rate limited to prevent brute-force guessing (30/min per IP)
router.get("/referral/:code", publicApiLimiter, validateReferralCode);

// ==================== ANNOUNCEMENTS ====================

// GET /api/public/announcements - Get active announcements
router.get("/announcements", announcementController.getActiveAnnouncements);

// ==================== ACTIVITIES ====================

// GET /api/public/activities - Get visible activities
router.get("/activities", activityController.getVisibleActivities);

// GET /api/public/activities/categories - Get activity categories
router.get("/activities/categories", activityController.getActivityCategories);

// GET /api/public/activities/:id - Get single activity
router.get("/activities/:id", activityController.getActivityByIdPublic);

// ==================== EVENTS ====================

// GET /api/public/events - Get published events
router.get("/events", eventController.getPublishedEvents);

// GET /api/public/events/upcoming - Get upcoming events
router.get("/events/upcoming", eventController.getUpcomingEvents);

// GET /api/public/events/featured - Get featured events
router.get("/events/featured", eventController.getFeaturedEvents);

// GET /api/public/events/:id - Get single event
router.get("/events/:id", eventController.getEventByIdPublic);

// ==================== TESTIMONIALS ====================

// GET /api/public/testimonials - Get approved testimonials
router.get("/testimonials", testimonialController.getApprovedTestimonials);

// POST /api/public/testimonials - Submit new testimonial (optional auth)
router.post(
  "/testimonials",
  optionalAuth,
  testimonialController.submitTestimonial,
);

// ==================== DONATION HEADS / CAUSES ====================

// GET /api/public/donation-heads - Get active donation heads
router.get("/donation-heads", donationHeadController.getActiveDonationHeads);

// GET /api/public/donation-heads/featured - Get featured donation heads
router.get(
  "/donation-heads/featured",
  donationHeadController.getFeaturedDonationHeads,
);

// GET /api/public/donation-heads/:key - Get donation head by key
router.get("/donation-heads/:key", donationHeadController.getDonationHeadByKey);

// GET /api/public/donation-heads/:key/stats - Get donation stats for a cause
router.get(
  "/donation-heads/:key/stats",
  donationHeadController.getDonationHeadStats,
);

// ==================== GALLERY ====================

// GET /api/public/gallery - Get all visible gallery categories with images
router.get("/gallery", galleryController.getVisibleGalleryCategories);

// GET /api/public/gallery/categories - Get gallery category names only
router.get("/gallery/categories", galleryController.getGalleryCategoryNames);

// GET /api/public/gallery/all-images - Get all gallery images flattened
router.get("/gallery/all-images", galleryController.getAllGalleryImages);

// GET /api/public/gallery/:slug - Get single gallery category by slug
router.get("/gallery/:slug", galleryController.getGalleryCategoryBySlug);

// ==================== PRODUCTS (Shop) ====================

// GET /api/public/products - Get active products
router.get("/products", productController.getActiveProducts);

// GET /api/public/products/featured - Get featured products
router.get("/products/featured", productController.getFeaturedProducts);

// GET /api/public/products/categories - Get visible product categories
router.get("/products/categories", productController.getVisibleCategories);

// GET /api/public/products/:slug - Get product by slug
router.get("/products/:slug", productController.getProductBySlug);

module.exports = router;
