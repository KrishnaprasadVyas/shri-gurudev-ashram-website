const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("path");
const connectDB = require("./config/db");

const app = express();

connectDB();

// Trust proxy for Nginx reverse proxy (correct client IP for rate limiting)
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://shrigurudevashram.org",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(cookieParser());
app.use("/api/webhooks/razorpay", express.raw({ type: "application/json", limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));

// Serve receipts as static files
app.use("/receipts", express.static(path.join(__dirname, "../receipts")));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/test", require("./routes/test.routes"));
app.use("/api/donations", require("./routes/donation.routes"));
app.use("/api/public", require("./routes/public.routes")); // Public APIs (no auth)
app.use("/api/webhooks", require("./routes/webhook.routes"));
app.use("/api/contact", require("./routes/contact.routes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/admin/website", require("./routes/admin.website.routes"));
app.use("/api/admin/system", require("./routes/admin.system.routes"));
// app.use("/api/products", require("./routes/product.routes"));
// app.use("/api/orders", require("./routes/order.routes"));
module.exports = app;
