const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// Link tới User model của bạn
require("dotenv").config();
const User = require("../src/models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cms_database";

const paraclinicalDoctors = [
  {
    name: "BS. Sinh Hiệu - Nguyễn Văn V",
    email: "sinhieu@clinic.com",
    password: "123456",
    role: "PARACLINICAL_DOCTOR",
    specialization: "VITALS",
    department: "INTERNAL_MEDICINE",
  },
  {
    name: "BS. Xét Nghiệm - Trần Thị X",
    email: "xetnghiem@clinic.com",
    password: "123456",
    role: "PARACLINICAL_DOCTOR",
    specialization: "BLOOD_TEST",
    department: "LABORATORY",
  },
  {
    name: "BS. Răng Hàm Mặt - Lê Văn R",
    email: "ranghammat@clinic.com",
    password: "123456",
    role: "PARACLINICAL_DOCTOR",
    specialization: "DENTAL",
    department: "NONE",
  },
  {
    name: "BS. X-Quang - Phạm Văn Q",
    email: "xquang@clinic.com",
    password: "123456",
    role: "PARACLINICAL_DOCTOR",
    specialization: "X_RAY",
    department: "X_RAY",
  },
  {
    name: "BS. Siêu Âm - Đỗ Thị S",
    email: "sieuam@clinic.com",
    password: "123456",
    role: "PARACLINICAL_DOCTOR",
    specialization: "ULTRASOUND",
    department: "X_RAY",
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connect to MongoDB successfully!");

    for (const doc of paraclinicalDoctors) {
      const existing = await User.findOne({ email: doc.email });
      if (existing) {
        console.log(`User ${doc.email} already exists, skipping...`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(doc.password, salt);

      const newUser = new User({
        ...doc,
        passwordHash,
        isVerified: true,
        authProvider: "local"
      });

      await newUser.save();
      console.log(`Created account for: ${doc.name} (${doc.specialization})`);
    }

    console.log("Seeding Paraclinical Doctors completed!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
