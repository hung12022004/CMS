const mongoose = require("mongoose");

const dailyStatsSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Định dạng YYYY-MM-DD
      required: true,
      unique: true,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalPatients: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyStats", dailyStatsSchema);
