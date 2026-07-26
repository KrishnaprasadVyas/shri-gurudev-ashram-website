const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize");
const adminController = require("../controllers/admin.nityaAnnadan.controller");

// Require Auth & Nitya Annadan Admin authorization for all routes
router.use(auth, authorize("SYSTEM_ADMIN", "NITYA_ANNADAN_ADMIN"));

// Overview dashboard metrics
router.get("/overview", adminController.getOverviewStats);

// Master Bookings Table & single booking detail
router.get("/bookings", adminController.getAllBookings);
router.get("/bookings/:id", adminController.getBookingById);

// Manual offline booking creation (Cash/UPI/Cheque)
router.post("/bookings/offline", adminController.createOfflineBooking);

// Status override & Date rescheduling
router.patch("/bookings/:id/status", adminController.updateBookingStatus);
router.patch("/bookings/:id/reschedule", adminController.rescheduleBooking);

// Calendar availability & daily patrons roster
router.get("/calendar", adminController.getCalendarView);

// Daily Printable Aarti & Mahaprasad announcement sheet
router.get("/daily-sheet", adminController.getDailyAartiSheet);

// Reports & CSV export
router.get("/reports", adminController.getReports);
router.get("/export", adminController.exportBookings);

// Date blocking management
router.post("/blocked-dates", adminController.blockDate);
router.delete("/blocked-dates/:date", adminController.unblockDate);

module.exports = router;
