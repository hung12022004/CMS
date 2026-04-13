const User = require("../models/User");
const AccountActionLog = require("../models/AccountActionLog");

/**
 * GET /api/v1/admin/users
 * Lấy danh sách tất cả user (phân trang)
 */
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-passwordHash")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error("getAllUsers error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * PATCH /api/v1/admin/users/:id/role
 * Admin đổi role cho user
 * body: { role }
 */
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ["admin", "doctor", "nurse", "patient"];
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({
                message: `Role không hợp lệ. Chọn: ${validRoles.join(", ")}`,
            });
        }

        // Không cho admin tự đổi role chính mình
        if (id === req.user.id) {
            return res.status(400).json({
                message: "Không thể đổi role của chính mình",
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true, select: "-passwordHash" }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: `Đã đổi role của ${user.name || user.email} thành ${role}`,
            user,
        });
    } catch (err) {
        console.error("updateUserRole error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * POST /api/v1/admin/users/create-staff
 * Admin tạo tài khoản bác sĩ / y tá
 * body: { name, email, password, role, gender }
 */
exports.createStaffAccount = async (req, res) => {
    try {
        const { name, email, password, role, gender, specialty, specialization } = req.body;

        // Validate role
        const allowedRoles = ["doctor", "nurse"];
        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({
                message: `Role phải là: ${allowedRoles.join(", ")}`,
            });
        }

        if (!email || !password || password.length < 6) {
            return res.status(400).json({
                message: "Email và password (tối thiểu 6 ký tự) là bắt buộc",
            });
        }

        // Check existing
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: "Email đã tồn tại" });
        }

        const bcrypt = require("bcryptjs");
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUserObj = {
            name: name || "",
            email: email.toLowerCase(),
            passwordHash,
            role,
            gender: gender || "unknown",
            isVerified: true,
            authProvider: "local",
        };

        if (role === "doctor" && specialty) {
            newUserObj.specialty = specialty;
        }

        // Chuyên môn cận lâm sàng (VITALS, BLOOD_TEST, DENTAL, X_RAY, ULTRASOUND)
        if (specialization) {
            newUserObj.specialization = specialization;
        }

        const user = await User.create(newUserObj);

        return res.status(201).json({
            message: `Đã tạo tài khoản ${role === "doctor" ? "bác sĩ" : "y tá"}: ${email}`,
            user,
        });
    } catch (err) {
        console.error("createStaffAccount error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * PATCH /api/v1/admin/users/:id/ban
 * Admin ban/unban user
 * body: { reason? }
 */
exports.toggleBanUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, action } = req.body;
        const adminId = req.user?.id;

        if (!reason || reason.trim() === "") {
            return res.status(400).json({ 
                success: false, 
                message: 'Thao tác thất bại: Bắt buộc phải nhập lý do khóa tài khoản.' 
            });
        }

        // Không cho ban chính mình
        if (id === adminId) {
            return res.status(400).json({ message: "Không thể ban chính mình" });
        }

        const user = await User.findById(id).select("role accountStatus name email");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin" || user.role === "ADMIN") {
            return res.status(403).json({ message: "Không thể khóa tài khoản Admin" });
        }

        const isBanned = user.accountStatus === "BANNED";
        
        let newStatus = "";
        let actionType = "";

        if (action === "BAN") {
            if (isBanned) return res.status(400).json({ message: "Tài khoản đã bị khóa từ trước" });
            newStatus = "BANNED";
            actionType = "BAN";
        } else if (action === "UNBAN") {
            if (!isBanned) return res.status(400).json({ message: "Tài khoản đang hoạt động, không thể unban" });
            newStatus = "ACTIVE";
            actionType = "UNBAN";
        } else {
            newStatus = isBanned ? "ACTIVE" : "BANNED";
            actionType = isBanned ? "UNBAN" : "BAN";
        }

        const updated = await User.findByIdAndUpdate(
            id,
            { $set: { accountStatus: newStatus, banReason: newStatus === "BANNED" ? reason : "" } },
            { new: true, select: "-passwordHash" }
        );

        try {
            const log = new AccountActionLog({
                userId: id,
                actionBy: adminId,
                actionType: actionType,
                reason: reason,
            });
            await log.save();
        } catch (logErr) {
            console.error("Cảnh báo: Lưu audit log thất bại:", logErr.message);
        }

        return res.status(200).json({
            message: newStatus === "BANNED"
                ? `Đã khóa tài khoản ${user.name || user.email}`
                : `Đã mở khóa tài khoản ${user.name || user.email}`,
            user: updated,
            accountStatus: newStatus,
        });
    } catch (err) {
        console.error("toggleBanUser error:", err);
        return res.status(500).json({ message: "Server error", detail: err.message });
    }
};

/**
 * GET /api/v1/admin/users/:id/ban-history
 * Lấy lịch sử ban/unban của user
 */
exports.getUserBanHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await AccountActionLog.find({ userId: id })
            .populate("actionBy", "name email")
            .sort({ createdAt: -1 });
            
        return res.status(200).json({ logs });
    } catch (err) {
        console.error("getUserBanHistory error:", err);
        return res.status(500).json({ message: "Server error", detail: err.message });
    }
};

