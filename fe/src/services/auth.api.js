import api from "./api";

export const registerApi = async ({ name, email, password }) => {
  const res = await api.post("/auth/register", { name, email, password });
  return res.data;
};

export const loginApi = async ({ email, password }) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const logoutApi = async () => {
  const res = await api.post("/auth/logout");
  return res.data;
};

export const meApi = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};
export const forgotPasswordApi = async ({ email }) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
};

/**
 * Reset mật khẩu bằng OTP
 * POST /api/v1/auth/reset-password
 * body: { email, otp, newPassword }
 */
export const resetPasswordApi = async ({ email, otp, newPassword }) => {
  const res = await api.post("/auth/reset-password", {
    email,
    otp,
    newPassword,
  });
  return res.data;
};

/**
 * (Optional) Verify OTP khi đăng ký
 * POST /api/v1/auth/verify-otp
 * body: { email, otp }
 */
export const verifyOtpApi = async ({ email, otp }) => {
  const res = await api.post("/auth/verify-register-otp", { email, otp });
  return res.data;
};
