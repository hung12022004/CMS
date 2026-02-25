const User = require("../models/User");

/**
 * Middleware phân quyền theo role
 * Sử dụng SAU middleware auth (cần req.user.id)
 * @param  {...string} roles - Danh sách role được phép truy cập
 */
function authorize(...roles) {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id).select("role");
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (!roles.includes(user.role)) {
                return res.status(403).json({
                    message: "Bạn không có quyền truy cập chức năng này",
                });
            }

            req.user.role = user.role;
            next();
        } catch (err) {
            console.error("authorize error:", err);
            return res.status(500).json({ message: "Server error" });
        }
    };
}

module.exports = authorize;
