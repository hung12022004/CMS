const bcrypt = require("bcryptjs");
const Otp = require("../models/Otp");

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createOtp({ email, type }) {
  await Otp.deleteMany({ email, type });

  const otp = generateOtp();
  const salt = await bcrypt.genSalt(10);
  const codeHash = await bcrypt.hash(otp, salt);

  await Otp.create({
    email,
    codeHash,
    type,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 phút
  });

  return otp; 
}

module.exports = { createOtp };
