const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const Otp = require("../models/Otp");

const { createOtp } = require("../utils/otp-provider");
const { sendOtpEmail } = require("../utils/mailer");

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* =======================
   JWT
======================= */
function signAccessToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );
}

/* =======================
   REGISTER
   POST /api/v1/auth/register
   body: { name?, email, password }
======================= */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email và password là bắt buộc" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "password tối thiểu 6 ký tự" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const exists = await User.findOne({ email: normalizedEmail });

    // Nếu email đã tồn tại VÀ đã được xác thực -> không cho đăng ký lại
    if (exists && exists.isVerified) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (exists && !exists.isVerified) {
      // Email tồn tại nhưng chưa xác thực -> cập nhật thông tin và gửi OTP mới
      await User.updateOne(
        { email: normalizedEmail },
        { name: name || exists.name, passwordHash }
      );
      // Xóa OTP cũ (nếu có)
      await Otp.deleteMany({ email: normalizedEmail, type: "REGISTER" });
    } else {
      // Tạo user mới
      await User.create({
        name: name || "",
        email: normalizedEmail,
        passwordHash,
        isVerified: false,
      });
    }

    // ✅ tạo OTP
    const otp = await createOtp({
      email: normalizedEmail,
      type: "REGISTER",
    });

    // ✅ gửi email HTML
    sendOtpEmail({ to: email, otp, type: "REGISTER" })
      .catch(err => console.error("Send mail error:", err));
    console.log(email, otp);
    return res.status(201).json({
      message: "Đăng ký thành công. Vui lòng nhập OTP gửi về email để xác thực.",
      email: normalizedEmail,
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   VERIFY REGISTER OTP
   POST /api/v1/auth/verify-register-otp
   body: { email, otp }
======================= */
exports.verifyRegisterOtp = async (req, res) => {
  try {


    const { email, otp } = req.body;
    console.log(email, otp);
    if (!email || !otp) {
      return res.status(400).json({ message: "email và otp là bắt buộc" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const record = await Otp.findOne({
      email: normalizedEmail,
      type: "REGISTER",
    });

    if (!record) {
      return res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    if (record.attempts >= 5) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "OTP đã bị khoá" });
    }

    const isValid = await bcrypt.compare(otp, record.codeHash);
    if (!isValid) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "OTP không đúng" });
    }

    await User.updateOne(
      { email: normalizedEmail },
      { isVerified: true }
    );

    await Otp.deleteOne({ _id: record._id });

    return res.status(200).json({
      message: "Xác thực email thành công. Bạn có thể đăng nhập.",
    });
  } catch (err) {
    console.error("verify otp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   LOGIN
   POST /api/v1/auth/login
   body: { email, password }
======================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email và password là bắt buộc" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Sai email hoặc password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email chưa được xác thực",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Sai email hoặc password" });
    }

    const accessToken = signAccessToken(user);

    return res.status(200).json({
      message: "Login thành công",
      user: user.toJSON(),
      accessToken,
      tokenType: "Bearer",
      expiresIn: 30 * 60,
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   LOGOUT
======================= */
exports.logout = async (_req, res) => {
  return res.status(200).json({
    message: "Logout thành công (frontend xoá accessToken)",
  });
};

/* =======================
   ME
======================= */
exports.me = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email là bắt buộc" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // ❗ Không leak email tồn tại hay không
    if (!user) {
      return res.status(200).json({
        message: "Nếu email tồn tại, OTP đã được gửi",
      });
    }

    const otp = await createOtp({
      email: normalizedEmail,
      type: "RESET_PASSWORD",
    });

    sendOtpEmail({ to: email, otp, type: "RESET_PASSWORD" })
      .catch(err => console.error("Send mail error:", err));
    return res.status(200).json({
      message: "OTP đặt lại mật khẩu đã được gửi về email",
    });
  } catch (err) {
    console.error("forgot-password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      console.log("BODY:", req.body);
      return res.status(400).json({
        message: "Email, otp và newPassword là bắt buộc",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        message: "Password tối thiểu 6 ký tự",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const record = await Otp.findOne({
      email: normalizedEmail,
      type: "RESET_PASSWORD",
    });

    if (!record) {
      return res.status(400).json({
        message: "OTP không hợp lệ hoặc đã hết hạn",
      });
    }

    if (record.attempts >= 5) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "OTP đã bị khoá" });
    }

    const isValid = await bcrypt.compare(otp, record.codeHash);
    if (!isValid) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "OTP không đúng" });
    }

    // ✅ update password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await User.updateOne(
      { email: normalizedEmail },
      { passwordHash }
    );

    // ✅ xoá OTP
    await Otp.deleteOne({ _id: record._id });

    return res.status(200).json({
      message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.",
    });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   GOOGLE LOGIN
   POST /api/v1/auth/google
   body: { credential }
======================= */
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential là bắt buộc" });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Không lấy được email từ Google" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Tìm user theo googleId hoặc email
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (user) {
      // User đã tồn tại
      if (!user.googleId) {
        // User đăng ký bằng email thường, link Google account
        user.googleId = googleId;
        user.authProvider = "google";
        user.isVerified = true;
        if (picture && !user.avatarUrl) {
          user.avatarUrl = picture;
        }
        await user.save();
      }
    } else {
      // Tạo user mới từ Google
      user = await User.create({
        email: normalizedEmail,
        name: name || "",
        googleId,
        authProvider: "google",
        isVerified: true,
        avatarUrl: picture || "",
      });
    }

    const accessToken = signAccessToken(user);

    return res.status(200).json({
      message: "Đăng nhập Google thành công",
      user: user.toJSON(),
      accessToken,
      tokenType: "Bearer",
      expiresIn: 30 * 60,
    });
  } catch (err) {
    console.error("google login error:", err);
    return res.status(500).json({ message: "Google login failed" });
  }
};
