const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize");
const { financialApiLimiter } = require("../middlewares/rateLimit");
const cashAdvanceController = require("../controllers/cashAdvance.controller");
const voucherController = require("../controllers/voucher.controller");

// Apply authentication, role authorization (TRUSTEE or SYSTEM_ADMIN), and rate limiting to all finance endpoints
router.use(auth);
router.use(authorize("TRUSTEE", "SYSTEM_ADMIN"));
router.use(financialApiLimiter);

/* ---------------- Cash Advances Routes ---------------- */
router.post("/advances", cashAdvanceController.createAdvance);
router.post("/advances/direct", cashAdvanceController.createDirectPayment);
router.get("/advances", cashAdvanceController.listAdvances);
router.get("/advances/:id", cashAdvanceController.getAdvanceById);
router.post("/advances/:id/settle", cashAdvanceController.settleAdvance);
router.patch("/advances/:id/cancel", cashAdvanceController.cancelAdvance);

/* ---------------- Vouchers Routes ---------------- */
router.get("/vouchers", voucherController.listVouchers);
router.get("/vouchers/:id", voucherController.getVoucherById);
router.get("/vouchers/:id/pdf", voucherController.downloadVoucherPdf);

module.exports = router;
