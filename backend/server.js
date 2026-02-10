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

// FIX 3: Warn if JWT_SECRET is too short (security best practice)
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn("⚠️  WARNING: JWT_SECRET is shorter than 32 characters. This is insecure for production.");
}

const app = require("./src/app");
const { startCleanupScheduler } = require("./src/utils/cleanup");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  // Start cleanup scheduler (runs every 6 hours)
  startCleanupScheduler(6);
});

// Production hardening: Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
  
  server.close(async () => {
    console.log("✅ HTTP server closed");
    
    try {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error during MongoDB disconnect:", err);
      process.exit(1);
    }
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error("❌ Forced shutdown after 30s timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Production hardening: Unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
  // Don't crash in production, but log for monitoring
});

// Production hardening: Uncaught exception handler
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Must exit on uncaught exception - state is unknown
  process.exit(1);
});
