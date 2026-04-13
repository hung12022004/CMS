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

/**
 * POST /api/v1/users/me/avatar
 * file: avatar (FormData)
 */
export const uploadAvatarApi = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await api.post("/users/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

/**
 * GET /api/v1/users/patients
 * Lấy danh sách bệnh nhân (cho bác sĩ / y tá)
 */
export const getPatientsApi = async () => {
  const res = await api.get("/users/patients");
  return res.data;
};

/**
 * GET /api/v1/users/doctors
 * Lấy danh sách bác sĩ
 */
export const getDoctorsApi = async () => {
  const res = await api.get("/users/doctors");
  return res.data;
};

/**
 * GET /api/v1/users/doctors/:id
 * Lấy chi tiết bác sĩ
 */
export const getDoctorByIdApi = async (id) => {
  const res = await api.get(`/users/doctors/${id}`);
  return res.data;
};

/**
 * GET /api/v1/users/doctors/:id/reviews
 * Lấy danh sách đánh giá của 1 bác sĩ
 */
export const getDoctorReviewsApi = async (id) => {
  const res = await api.get(`/users/doctors/${id}/reviews`);
  return res.data;
};

/**
 * POST /api/v1/users/:id/ban
 * Khóa / mở khóa tài khoản
 * body: { action, reason }
 */
export const toggleBanUserApi = async (id, payload) => {
  const res = await api.post(`/users/${id}/ban`, payload);
  return res.data;
};
