const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 50, default: "" },

    nickname: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
      default: "",
      match: [/^\+?[0-9]{9,15}$/, "Invalid phone number"],
    },

    passwordHash: { type: String, required: false, default: null },

    // Google OAuth fields
    googleId: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },

    role: {
      type: String,
      enum: ["admin", "doctor", "nurse", "patient", "CLINICAL_DOCTOR", "PARACLINICAL_DOCTOR", "ADMIN"],
      default: "patient",
    },

    department: {
      type: String,
      enum: ["INTERNAL_MEDICINE", "X_RAY", "LABORATORY", "NONE"],
      default: "NONE",
    },

    // Chuyên môn cận lâm sàng (dùng để lọc hàng đợi dịch vụ)
    specialization: {
      type: String,
      enum: ["VITALS", "BLOOD_TEST", "DENTAL", "X_RAY", "ULTRASOUND", "NONE"],
      default: "NONE",
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", "unknown"],
      default: "unknown",
    },

    language: {
      type: String,
      enum: ["vi", "en", "ja", "ko", "zh"],
      default: "vi",
    },

    accountStatus: {
      type: String,
      enum: ["ACTIVE", "BANNED"],
      default: "ACTIVE",
    },

    banReason: {
      type: String,
      default: "",
    },

    avatarUrl: {
      type: String,
      default: "",
    },
    // For doctors
    specialty: {
      type: String,
      default: "Đa khoa",
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ẩn passwordHash khi trả JSON
userSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
