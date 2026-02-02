require("dotenv").config();

// Validate required environment variables at startup
const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnvVars.join(", "));
  process.exit(1);
}

const app = require("./src/app");
const { startCleanupScheduler } = require("./src/utils/cleanup");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  // Start cleanup scheduler (runs every 6 hours)
  startCleanupScheduler(6);
});
