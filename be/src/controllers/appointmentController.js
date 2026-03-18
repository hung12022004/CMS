const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { sendAppointmentConfirmationEmail } = require("../utils/mailer");

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
                const aptPatientId = appointment.patientId?._id 
                    ? appointment.patientId._id.toString() 
                    : appointment.patientId?.toString();
                    
                if (aptPatientId !== userId?.toString()) {
                return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
            }
        }

        appointment.status = status;
        await appointment.save();

        // Gửi email nếu trạng thái là confirmed (Bác sĩ chấp nhận)
        if (status === "confirmed") {
            try {
                // Lấy thông tin bệnh nhân để gửi mail
                const patient = await User.findById(appointment.patientId);
                if (patient && patient.email) {
                    await sendAppointmentConfirmationEmail({
                        to: patient.email,
                        patientName: patient.name || "Quý khách",
                        date: appointment.date,
                        time: appointment.time,
                        type: appointment.type
                    });
                    console.log(`Email confirmed sent to ${patient.email}`);
                }
            } catch (mailError) {
                console.error("Lỗi gửi email xác nhận:", mailError);
                // Không return lỗi ở đây để tránh làm gián đoạn luồng chính của API
            }
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

// PATCH /api/v1/appointments/:id/review
// Thêm đánh giá cho lịch hẹn đã hoàn thành
exports.reviewAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, review } = req.body;
        const patientId = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating phải từ 1 đến 5 sao" });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }

        // Check if user is the patient of this appointment
        const aptPatientId = appointment.patientId?._id 
            ? appointment.patientId._id.toString() 
            : appointment.patientId?.toString();
            
        if (aptPatientId !== patientId) {
            return res.status(403).json({ message: "Bạn không có quyền đánh giá lịch hẹn này" });
        }

        if (appointment.status !== "completed") {
            return res.status(400).json({ message: "Chỉ có thể đánh giá lịch hẹn đã hoàn thành" });
        }

        if (appointment.rating) {
            return res.status(400).json({ message: "Lịch hẹn này đã được đánh giá" });
        }

        appointment.rating = rating;
        if (review) appointment.review = review;
        await appointment.save();

        // Recalculate doctor's rating
        const doctorId = appointment.doctorId?._id 
            ? appointment.doctorId._id.toString() 
            : appointment.doctorId?.toString();

        const allDoctorAppointments = await Appointment.find({
            doctorId,
            rating: { $exists: true, $ne: null }
        });

        const totalRating = allDoctorAppointments.reduce((sum, apt) => sum + apt.rating, 0);
        const reviewsCount = allDoctorAppointments.length;
        const averageRating = reviewsCount > 0 ? (totalRating / reviewsCount).toFixed(1) : 0;

        await User.findByIdAndUpdate(doctorId, {
            rating: averageRating,
            reviewsCount: reviewsCount
        });

        return res.status(200).json({
            message: "Đánh giá thành công",
            appointment,
        });

    } catch (err) {
        console.error("reviewAppointment error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
