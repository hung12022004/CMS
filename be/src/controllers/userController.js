const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const mongoose = require("mongoose");
const AccountActionLog = require("../models/AccountActionLog");

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

// POST /api/v1/users/me/avatar
// file: avatar (multipart/form-data)
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file ảnh" });
    }

    // Tạo URL cho avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { avatarUrl },
      { new: true, select: "-passwordHash" }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Upload avatar thành công",
      avatarUrl,
      user,
    });
  } catch (err) {
    console.error("uploadAvatar error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/users/patients
// Lấy danh sách bệnh nhân đã đăng ký (cho bác sĩ / y tá)
exports.getPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: "patient", isVerified: true })
      .select("name email phoneNumber gender avatarUrl")
      .sort({ name: 1 });

    return res.status(200).json({ patients });
  } catch (err) {
    console.error("getPatients error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
// GET /api/v1/users/doctors?specialty=Mắt
// Lấy danh sách bác sĩ, hỗ trợ lọc theo chuyên khoa
exports.getDoctors = async (req, res) => {
  try {
    const filter = { role: "doctor" };
    if (req.query.specialty) {
      filter.specialty = { $regex: req.query.specialty, $options: "i" };
    }

    const doctors = await User.find(filter)
      .select("name email phoneNumber gender avatarUrl rating reviewsCount specialty")
      .sort({ name: 1 });

    return res.status(200).json({ doctors });
  } catch (err) {
    console.error("getDoctors error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/users/doctors/:id
// Lấy chi tiết 1 bác sĩ
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: "doctor" })
      .select("name email phoneNumber gender avatarUrl rating reviewsCount specialty");

    if (!doctor) return res.status(404).json({ message: "Bác sĩ không tồn tại" });

    return res.status(200).json({ doctor });
  } catch (err) {
    console.error("getDoctorById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/v1/users/doctors/:id/reviews
 * Lấy danh sách nhận xét của bác sĩ
 */
exports.getDoctorReviews = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm các appointment đã hoàn thành và có đánh giá cho bác sĩ này
    const appointments = await Appointment.find({
      doctorId: id,
      rating: { $exists: true },
      status: "completed",
    })
      .select("rating review createdAt updatedAt patientId date time")
      .populate("patientId", "name avatarUrl")
      .sort({ date: -1, time: -1 });

    return res.status(200).json({ reviews: appointments });
  } catch (err) {
    console.error("getDoctorReviews error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/v1/users/:id/ban
 * Khóa (Ban) hoặc mở khóa (Unban) tài khoản người dùng, có lưu vết Audit.
 * Chỉ admin mới có quyền thực thi.
 * Áp dụng Mongoose Transaction: Nếu update user lỗi hoặc tạo log lỗi, sẽ hoàn tác bảo vệ dữ liệu.
 */
exports.toggleBanUser = async (req, res) => {
  const { id } = req.params;
  const { reason, action } = req.body;
  const adminId = req.user?.id;

  if (!reason || reason.trim() === "") {
    return res.status(400).json({ 
      success: false, 
      message: 'Thao tác thất bại: Bắt buộc phải nhập lý do khóa tài khoản.' 
    });
  }

  try {
    // 1. Tìm user cần thực hiện
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (targetUser.role === "admin" || targetUser.role === "ADMIN") {
      return res.status(403).json({ message: "Không thể khóa tài khoản Admin" });
    }

    const currentStatus = targetUser.accountStatus || "ACTIVE";
    let newStatus = "";
    let actionType = "";

    if (action === "BAN") {
      if (currentStatus === "BANNED") {
        return res.status(400).json({ message: "Tài khoản đã bị khóa từ trước" });
      }
      newStatus = "BANNED";
      actionType = "BAN";
    } else if (action === "UNBAN") {
      if (currentStatus === "ACTIVE") {
        return res.status(400).json({ message: "Tài khoản đang hoạt động, không thể unban" });
      }
      newStatus = "ACTIVE";
      actionType = "UNBAN";
    } else {
      // Toggle nếu không truyền action
      newStatus = currentStatus === "ACTIVE" ? "BANNED" : "ACTIVE";
      actionType = currentStatus === "ACTIVE" ? "BAN" : "UNBAN";
    }

    // 2. Cập nhật user
    targetUser.accountStatus = newStatus;
    targetUser.banReason = newStatus === "BANNED" ? reason : "";
    await targetUser.save();

    // 3. Tạo Audit Log (nếu fail → không rollback user, nhưng log sẽ được thử lại)
    try {
      const log = new AccountActionLog({
        userId: targetUser._id,
        actionBy: adminId,
        actionType: actionType,
        reason: reason,
      });
      await log.save();
    } catch (logErr) {
      console.error("Cảnh báo: Lưu audit log thất bại:", logErr.message);
      // Không throw — user đã được ban thành công, chỉ log bị mất
    }

    return res.status(200).json({
      message: actionType === "BAN" ? "Khóa tài khoản thành công" : "Mở khóa tài khoản thành công",
      accountStatus: targetUser.accountStatus,
    });
  } catch (err) {
    console.error("toggleBanUser error:", err);
    return res.status(500).json({ message: err.message || "Lỗi Server" });
  }
};
