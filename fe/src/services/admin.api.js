import api from "./api";

/**
 * Lấy danh sách tất cả user (Admin only)
 */
export const getAllUsersApi = async ({ page = 1, limit = 20, search = "" } = {}) => {
    const res = await api.get("/admin/users", {
        params: { page, limit, search },
    });
    return res.data;
};

/**
 * Đổi role cho user (Admin only)
 */
export const updateUserRoleApi = async (userId, role) => {
    const res = await api.patch(`/admin/users/${userId}/role`, { role });
    return res.data;
};

/**
 * Tạo tài khoản bác sĩ / y tá (Admin only)
 */
export const createStaffAccountApi = async (data) => {
    const res = await api.post("/admin/users/create-staff", data);
    return res.data;
};

/**
 * Ban / Unban user (Admin only)
 */
export const toggleBanUserApi = async (userId) => {
    const res = await api.patch(`/admin/users/${userId}/ban`);
    return res.data;
};
