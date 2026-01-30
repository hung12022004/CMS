import api from "./api";

/**
 * GET /api/v1/users/me
 * Lấy thông tin user hiện tại
 */
export const getMeApi = async () => {
  const res = await api.get("/users/me");
  return res.data;
};

/**
 * PATCH /api/v1/users/me
 * body: { name?, avatarUrl? }
 */
export const updateProfileApi = async (payload) => {
  const res = await api.patch("/users/me", payload);
  return res.data;
};

/**
 * PATCH /api/v1/users/me/password
 * body: { currentPassword, newPassword }
 */
export const changePasswordApi = async (payload) => {
  const res = await api.patch("/users/me/password", payload);
  return res.data;
};

