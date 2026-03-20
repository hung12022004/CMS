import api from "./api";

export const getAppointmentsApi = async () => {
    const { data } = await api.get("/appointments");
    return data;
};

export const createAppointmentApi = async (appointmentData) => {
    const { data } = await api.post("/appointments", appointmentData);
    return data;
};

/**
 * PATCH /api/v1/appointments/:id/status
 * Cập nhật trạng thái lịch hẹn
 */
export const updateAppointmentStatusApi = async (id, status) => {
    const res = await api.patch(`/appointments/${id}/status`, { status });
    return res.data;
};

/**
 * PATCH /api/v1/appointments/:id
 * Cập nhật thông tin lịch hẹn (dùng cho đổi lịch)
 */
export const updateAppointmentDetailsApi = async (id, payload) => {
    const res = await api.patch(`/appointments/${id}`, payload);
    return res.data;
};
