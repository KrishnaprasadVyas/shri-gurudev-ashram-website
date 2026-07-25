const mongoose = require("mongoose");
const { mainDb } = require("../config/db");

const nityaAnnadanBlockedDateSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      index: true, // ISO format YYYY-MM-DD
    },
    reason: {
      type: String,
      default: "Blocked by Ashram Admin",
      trim: true,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports =
  mainDb.models.NityaAnnadanBlockedDate ||
  mainDb.model("NityaAnnadanBlockedDate", nityaAnnadanBlockedDateSchema);
