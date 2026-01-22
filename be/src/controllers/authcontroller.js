const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signAccessToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "30m" } // access token 30 phút
  );
}

/**
 * POST /api/v1/auth/register
 * body: { name?, email, password }
 */
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
    if (exists) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name || "",
      email: normalizedEmail,
      passwordHash,
    });

    // ✅ chỉ trả user, KHÔNG trả token
    return res.status(201).json({
      message: "Register thành công. Hãy đăng nhập.",
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/v1/auth/login
 * body: { email, password }
 */
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
      expiresIn: 30 * 60, // giây
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/v1/auth/logout
 * JWT stateless => backend không “huỷ token” được nếu không có blacklist/refresh token.
 * Demo: chỉ trả message, frontend xoá localStorage là coi như logout.
 */
exports.logout = async (req, res) => {
  return res.status(200).json({
    message: "Logout thành công (frontend hãy xoá accessToken ở localStorage)",
  });
};

/**
 * GET /api/v1/auth/me
 * Header: Authorization: Bearer <token>
 */
exports.me = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
