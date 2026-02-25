/**
 * Seed script: Tạo 4 tài khoản mẫu cho 4 role
 * Chạy: node src/seed.js
 */
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const SEED_USERS = [
    {
        name: "Admin User",
        email: "admin@clinic.com",
        role: "admin",
        gender: "male",
    },
    {
        name: "BS. Nguyễn Văn A",
        email: "doctor@clinic.com",
        role: "doctor",
        gender: "male",
    },
    {
        name: "YT. Trần Thị B",
        email: "nurse@clinic.com",
        role: "nurse",
        gender: "female",
    },
    {
        name: "Lê Văn C",
        email: "patient@clinic.com",
        role: "patient",
        gender: "male",
    },
];

const DEFAULT_PASSWORD = "123456";

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ Missing MONGODB_URI in .env");
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    for (const userData of SEED_USERS) {
        const exists = await User.findOne({ email: userData.email });

        if (exists) {
            // Cập nhật lại role + password nếu đã tồn tại
            await User.updateOne(
                { email: userData.email },
                {
                    name: userData.name,
                    role: userData.role,
                    gender: userData.gender,
                    passwordHash,
                    isVerified: true,
                    authProvider: "local",
                }
            );
            console.log(`🔄 Updated: ${userData.email} → role: ${userData.role}`);
        } else {
            await User.create({
                ...userData,
                passwordHash,
                isVerified: true,
                authProvider: "local",
            });
            console.log(`✅ Created: ${userData.email} → role: ${userData.role}`);
        }
    }

    console.log("\n🎉 Seed hoàn tất! Tất cả tài khoản dùng password: 123456");
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
});
