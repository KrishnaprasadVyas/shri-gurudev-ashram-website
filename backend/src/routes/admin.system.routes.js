const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize");
const adminController = require("../controllers/admin.controller");

router.get(
  "/donations",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.getAllDonations
);

router.get(
  "/donors",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.getAllDonors
);

router.get(
  "/reports",
  auth,
  authorize("SYSTEM_ADMIN"),
  adminController.getReports
);

module.exports = router;
