const mongoose = require("mongoose");

const accountActionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionType: {
      type: String,
      enum: ["BAN", "UNBAN"],
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Lý do thao tác là bắt buộc để lưu vết hệ thống.'],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccountActionLog", accountActionLogSchema);
