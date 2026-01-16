const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorize");
const galleryController = require("../controllers/gallery.controller");

router.post(
  "/gallery",
  auth,
  authorize("WEBSITE_ADMIN"),
  galleryController.createGalleryItem
);

router.put(
  "/gallery/:id",
  auth,
  authorize("WEBSITE_ADMIN"),
  galleryController.updateGalleryItem
);

router.delete(
  "/gallery/:id",
  auth,
  authorize("WEBSITE_ADMIN"),
  galleryController.deleteGalleryItem
);

module.exports = router;
