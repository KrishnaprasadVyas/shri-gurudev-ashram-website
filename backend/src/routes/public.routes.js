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
const bannerController = require("../controllers/banner.controller");
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

// Language middleware for multilingual content
const langMiddleware = require("../middlewares/lang.middleware");

// ==================== DONATION DATA ====================

// GET /api/public/donations/recent - Last 10 successful donations
router.get("/donations/recent", getRecentDonations);

// GET /api/public/donations/top - Top 5 donors by total amount
router.get("/donations/top", getTopDonors);

// ==================== REFERRAL ====================

// GET /api/public/referral/:code - Validate referral code and get collector name
// FIX 2: Rate limited to prevent brute-force guessing (30/min per IP)
router.get("/referral/:code", publicApiLimiter, validateReferralCode);

// ==================== SITE CONFIG ====================

// GET /api/public/site-config/live-link - Get active live link
router.get(
  "/site-config/live-link",
  require("../controllers/siteConfig.controller").getPublicLiveLink,
);

// ==================== ANNOUNCEMENTS ====================

// GET /api/public/announcements - Get active announcements
router.get("/announcements", langMiddleware, announcementController.getActiveAnnouncements);

// ==================== BANNERS (Hero Slider) ====================

// GET /api/public/banners - Get active hero banners
router.get("/banners", langMiddleware, bannerController.getActiveBanners);

// ==================== ACTIVITIES ====================

// GET /api/public/activities - Get visible activities
router.get("/activities", langMiddleware, activityController.getVisibleActivities);

// GET /api/public/activities/categories - Get activity categories
router.get("/activities/categories", langMiddleware, activityController.getActivityCategories);

// GET /api/public/activities/:id - Get single activity
router.get("/activities/:id", langMiddleware, activityController.getActivityByIdPublic);

// ==================== EVENTS ====================

// GET /api/public/events - Get published events
router.get("/events", langMiddleware, eventController.getPublishedEvents);

// GET /api/public/events/upcoming - Get upcoming events
router.get("/events/upcoming", langMiddleware, eventController.getUpcomingEvents);

// GET /api/public/events/featured - Get featured events
router.get("/events/featured", langMiddleware, eventController.getFeaturedEvents);

// GET /api/public/events/:id - Get single event
router.get("/events/:id", langMiddleware, eventController.getEventByIdPublic);

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
router.get("/donation-heads", langMiddleware, donationHeadController.getActiveDonationHeads);

// GET /api/public/donation-heads/featured - Get featured donation heads
router.get(
  "/donation-heads/featured",
  langMiddleware,
  donationHeadController.getFeaturedDonationHeads,
);

// GET /api/public/donation-heads/:key - Get donation head by key
router.get("/donation-heads/:key", langMiddleware, donationHeadController.getDonationHeadByKey);

// GET /api/public/donation-heads/:key/stats - Get donation stats for a cause
router.get(
  "/donation-heads/:key/stats",
  langMiddleware,
  donationHeadController.getDonationHeadStats,
);

// ==================== GALLERY ====================

// GET /api/public/gallery - Get all visible gallery categories with images
router.get("/gallery", langMiddleware, galleryController.getVisibleGalleryCategories);

// GET /api/public/gallery/categories - Get gallery category names only
router.get("/gallery/categories", langMiddleware, galleryController.getGalleryCategoryNames);

// GET /api/public/gallery/all-images - Get all gallery images flattened
router.get("/gallery/all-images", langMiddleware, galleryController.getAllGalleryImages);

// GET /api/public/gallery/:slug - Get single gallery category by slug
router.get("/gallery/:slug", langMiddleware, galleryController.getGalleryCategoryBySlug);

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
