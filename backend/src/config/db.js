const mongoose = require("mongoose");

const mainDb = mongoose.createConnection();
const sharedDb = mongoose.createConnection();

const connectWithRetry = async (connection, uri, label) => {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds

  if (!uri) {
    throw new Error(`${label} URI is not configured`);
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await connection.openUri(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ ${label} connected`);
      return;
    } catch (error) {
      console.error(
        `❌ ${label} connection attempt ${attempt}/${maxRetries} failed:`,
        error.message,
      );

      if (attempt < maxRetries) {
        console.log(`⏳ Retrying ${label} in ${retryDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw new Error(`Could not connect ${label} after ${maxRetries} attempts`);
};

const connectDB = async () => {
  try {
    await Promise.all([
      connectWithRetry(mainDb, process.env.MONGO_URI, "mainDb"),
      connectWithRetry(sharedDb, process.env.MONGO_URI_SHARED, "sharedDb"),
    ]);
  } catch (error) {
    console.error("❌ Could not establish MongoDB connections:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.mainDb = mainDb;
module.exports.sharedDb = sharedDb;
