import api from "./api";

// Xác nhận thanh toán & sinh mã hóa đơn
export const confirmManualPaymentApi = async (appointmentId) => {
    const res = await api.post("/payments/confirm-manual", { appointmentId });
    return res.data;
};
