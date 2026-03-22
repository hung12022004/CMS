import api from "./api";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

/**
 * POST /api/v1/queue — Public (no auth needed)
 * Bệnh nhân walk-in đăng ký hàng đợi
 */
export const createQueueEntryApi = async (data) => {
    const res = await axios.post(`${BASE_URL}/queue`, data);
    return res.data;
};

/**
 * GET /api/v1/queue — Auth required
 * Lấy danh sách hàng đợi (theo role)
 */
export const getQueueEntriesApi = async () => {
    const res = await api.get("/queue");
    return res.data;
};

/**
 * PATCH /api/v1/queue/:id/assign — nurse/admin
 * Y tá gán bác sĩ
 * body: { doctorId, triageNotes? }
 */
export const assignDoctorApi = async (id, doctorId, triageNotes = "") => {
    const res = await api.patch(`/queue/${id}/assign`, { doctorId, triageNotes });
    return res.data;
};

/**
 * PATCH /api/v1/queue/:id/status — doctor/nurse/admin
 * Cập nhật trạng thái hàng đợi
 */
export const updateQueueStatusApi = async (id, status) => {
    const res = await api.patch(`/queue/${id}/status`, { status });
    return res.data;
};
