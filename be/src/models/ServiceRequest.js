const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    encounterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalEncounter",
      required: true,
    },
    type: {
      type: String,
      required: true, // X_RAY, BLOOD_TEST, v.v.
      trim: true,
    },
    targetDepartment: {
      type: String,
      required: true,
      enum: ["INTERNAL_MEDICINE", "X_RAY", "LABORATORY"], // Và các khoa khác nếu cần
    },
    resultData: {
      type: mongoose.Schema.Types.Mixed, // Có thể là String or Object tùy loại xét nghiệm
      default: null,
    },
    executedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Sẽ được gán khi Bác sĩ Cận lâm sàng (Bác sĩ B) bấm "tiếp nhận"
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
