const User = require("../models/User");

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
        const { name, email, password, role, gender } = req.body;

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

        const user = await User.create({
            name: name || "",
            email: email.toLowerCase(),
            passwordHash,
            role,
            gender: gender || "unknown",
            isVerified: true,
            authProvider: "local",
        });

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
 */
exports.toggleBanUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Không cho ban chính mình
        if (id === req.user.id) {
            return res.status(400).json({ message: "Không thể ban chính mình" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.isBanned = !user.isBanned;
        await user.save();

        return res.status(200).json({
            message: user.isBanned
                ? `Đã khóa tài khoản ${user.name || user.email}`
                : `Đã mở khóa tài khoản ${user.name || user.email}`,
            user,
        });
    } catch (err) {
        console.error("toggleBanUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
