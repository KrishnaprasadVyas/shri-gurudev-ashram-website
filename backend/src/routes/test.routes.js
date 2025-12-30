const router = require("express").Router();
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: {
      id: req.user._id,
      mobile: req.user.mobile,
    },
  });
});

module.exports = router;
