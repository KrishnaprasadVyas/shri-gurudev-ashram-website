const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { sendContactEmail } = require("../controllers/contact.controller");

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { message: "Too many requests, please try again later" },
});

router.post("/", contactLimiter, sendContactEmail);

module.exports = router;
