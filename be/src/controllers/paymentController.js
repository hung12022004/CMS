const Appointment = require("../models/Appointment");

// POST /api/v1/payments/confirm-manual
// Xác nhận thanh toán & sinh mã hóa đơn
exports.confirmManualPayment = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointment = await Appointment.findById(appointmentId);
        
        if (!appointment) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        
        // Nếu đã xác nhận rồi
        if (appointment.paymentStatus === "paid") {
            return res.status(200).json({ 
                message: "Lịch hẹn đã được thanh toán",
                orderCode: appointment.orderCode
            });
        }
        
        // Tạo mã đơn hàng (mã hóa đơn điện tử)
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
        appointment.orderCode = orderCode;

        // Cập nhật trạng thái
        appointment.paymentStatus = "paid";
        // Bệnh nhân thanh toán xong vẫn chờ y tá xác nhận để tạo queue
        await appointment.save();
        
        return res.status(200).json({ 
            message: "Xác nhận thành công",
            orderCode: orderCode,
            amount: 300000 // default price
        });
    } catch (error) {
        console.error("confirmManualPayment error:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};
