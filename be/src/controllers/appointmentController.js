const Appointment = require("../models/Appointment");
const User = require("../models/User");
const DoctorSchedule = require("../models/DoctorSchedule");

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

        // Validate working hours
        if (doctorId !== "quick") { // assuming quick booking assigns automatically
            const schedule = await DoctorSchedule.findOne({ doctorId, date });
            if (schedule) {
                if (!schedule.isWorking) {
                    return res.status(400).json({ message: "Bác sĩ nghỉ làm việc vào ngày này" });
                }
                const reqTime = time.split(":").map(Number);
                const startTime = schedule.startTime.split(":").map(Number);
                const endTime = schedule.endTime.split(":").map(Number);
                
                const reqTotal = reqTime[0] * 60 + reqTime[1];
                const startTotal = startTime[0] * 60 + startTime[1];
                const endTotal = endTime[0] * 60 + endTime[1];
                
                if (reqTotal < startTotal || reqTotal > endTotal - 30) {
                    return res.status(400).json({ message: "Giờ khám không nằm trong khung giờ làm việc của bác sĩ" });
                }
            }
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
        const { role, id: userId } = req.user;

        const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: "Status không hợp lệ" });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }

        // Security checks
        if (role === "patient") {
            // Patients can only cancel
            if (status !== "cancelled") {
                return res.status(403).json({ message: "Bạn chỉ có quyền hủy lịch hẹn" });
            }
            // Patients can only cancel their own appointments
            if (appointment.patientId.toString() !== userId) {
                return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
            }
        }

        appointment.status = status;
        await appointment.save();

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

/**
 * PATCH /api/v1/appointments/:id/review
 * Bệnh nhân đánh giá lịch hẹn sau khi khám
 * body: { rating, review }
 */
exports.reviewAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, review } = req.body;
        const userId = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating từ 1-5 là bắt buộc" });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }

        if (appointment.patientId.toString() !== userId) {
            return res.status(403).json({ message: "Bạn không có quyền đánh giá lịch hẹn này" });
        }

        if (appointment.status !== "completed") {
            return res.status(400).json({ message: "Chỉ có thể đánh giá lịch hẹn đã hoàn thành" });
        }

        if (appointment.rating) {
            return res.status(400).json({ message: "Lịch hẹn này đã được đánh giá rồi" });
        }

        // 1. Update appointment
        appointment.rating = rating;
        appointment.review = review || "";
        await appointment.save();

        // 2. Update doctor average rating
        const doctorId = appointment.doctorId;
        const doctor = await User.findById(doctorId);
        if (doctor) {
            const allRatedAppointments = await Appointment.find({
                doctorId,
                rating: { $exists: true },
            });

            const totalRating = allRatedAppointments.reduce((sum, app) => sum + app.rating, 0);
            const count = allRatedAppointments.length;

            doctor.rating = parseFloat((totalRating / count).toFixed(1));
            doctor.reviewsCount = count;
            await doctor.save();
        }

        return res.status(200).json({
            message: "Đánh giá thành công",
            rating: appointment.rating,
            reviewsCount: doctor ? doctor.reviewsCount : 0,
        });
    } catch (err) {
        console.error("reviewAppointment error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
