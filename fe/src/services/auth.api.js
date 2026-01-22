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
