const Appointment = require("../models/Appointment");
const User = require("../models/User");

// GET /api/v1/appointments
exports.getAppointments = async (req, res) => {
    try {
        const { role, id } = req.user;
        let filter = {};

        if (role === "patient") {
            filter.patientId = id;
        } else if (role === "doctor") {
            filter.doctorId = id;
        } else if (role === "nurse" || role === "admin") {
            // Nurse/Admin can see all, or we could filter by specific criteria if needed
            filter = {};
        }

        const appointments = await Appointment.find(filter)
            .populate("patientId", "name email phoneNumber gender avatarUrl")
            .populate("doctorId", "name email phoneNumber gender avatarUrl")
            .sort({ date: -1, time: -1 });

        return res.status(200).json({ appointments });
    } catch (err) {
        console.error("getAppointments error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// POST /api/v1/appointments
exports.createAppointment = async (req, res) => {
    try {
        const { doctorId, date, time, type, reason, address } = req.body;
        const patientId = req.user.id; // Lấy ID từ token để đảm bảo tính bảo mật

        if (!doctorId || !date || !time) {
            return res.status(400).json({ message: "Thiếu thông tin bác sĩ, ngày hoặc giờ khám" });
        }

        const newAppointment = await Appointment.create({
            patientId,
            doctorId,
            date,
            time,
            type: type || "clinic",
            reason: reason || "",
            address: address || "",
            status: "pending",
        });

        return res.status(201).json({
            message: "Đặt lịch hẹn thành công",
            appointment: newAppointment,
        });
    } catch (err) {
        console.error("createAppointment error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/v1/appointments/:id/status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: "Status không hợp lệ" });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }

        return res.status(200).json({
            message: "Cập nhật trạng thái thành công",
            appointment,
        });
    } catch (err) {
        console.error("updateStatus error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/v1/appointments/:id
// Cập nhật thông tin lịch hẹn (ngày, giờ, lý do, type)
exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time, type, reason } = req.body;

        const updateData = {};
        if (date) updateData.date = date;
        if (time) updateData.time = time;
        if (type) updateData.type = type;
        if (reason !== undefined) updateData.reason = reason;

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }

        return res.status(200).json({
            message: "Cập nhật lịch hẹn thành công",
            appointment,
        });

    } catch (err) {
        console.error("updateAppointment error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
