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
      enum: ["admin", "doctor", "nurse", "patient"],
      default: "patient",
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

    isBanned: {
      type: Boolean,
      default: false,
    },

    avatarUrl: {
      type: String,
      default: "",
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
