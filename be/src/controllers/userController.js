const bcrypt = require("bcryptjs");
const User = require("../models/User");

// GET /api/v1/users/me
exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ user });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/v1/users/me
// body: { name?, avatarUrl? }
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user?.id;

    const {
      name,
      nickname,
      phoneNumber,
      gender,
      language,
      avatarUrl,
    } = req.body;

    const update = {};

    if (typeof name === "string") update.name = name.trim();
    if (typeof nickname === "string") update.nickname = nickname.trim();
    if (typeof phoneNumber === "string")
      update.phoneNumber = phoneNumber.trim();
    if (typeof avatarUrl === "string")
      update.avatarUrl = avatarUrl.trim();

    // validate enum thủ công (optional, để tránh message khó hiểu)
    if (gender && ["male", "female", "other", "unknown"].includes(gender)) {
      update.gender = gender;
    }

    if (language && ["vi", "en", "ja", "ko", "zh"].includes(language)) {
      update.language = language;
    }

    // Nếu không có field nào hợp lệ
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu để cập nhật" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      {
        new: true,
        runValidators: true,
        select: "-passwordHash",
      }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "Cập nhật profile thành công",
      user,
    });
  } catch (err) {
    console.error("updateMe error:", err);

    // Bắt lỗi trùng nickname (nếu unique)
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Nickname hoặc phone number đã tồn tại",
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/v1/users/me/password
// body: { currentPassword, newPassword }
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "currentPassword và newPassword là bắt buộc" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "newPassword tối thiểu 6 ký tự" });
    }

    // passwordHash đang select:false trong schema => phải select('+passwordHash')
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Current password không đúng" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
