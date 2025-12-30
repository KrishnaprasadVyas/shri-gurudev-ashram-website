const router = require("express").Router();
const authMiddleware = require("../middlewares/auth.middleware");
const { createDonation } = require("../controllers/donation.controller");

router.post("/create", authMiddleware, createDonation);

module.exports = router;
