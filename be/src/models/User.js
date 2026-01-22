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

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "doctor", "patient"],
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
