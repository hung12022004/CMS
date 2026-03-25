const QueueEntry = require("../models/QueueEntry");
const User = require("../models/User");

/**
 * POST /api/v1/queue
 * Public — no auth required
 * Bệnh nhân đăng ký hàng đợi walk-in
 */
exports.createEntry = async (req, res) => {
    try {
        const { patientName, patientPhone, symptoms, appointmentId } = req.body;

        if (!patientName || !symptoms) {
            return res.status(400).json({ message: "Họ tên và triệu chứng là bắt buộc" });
        }

        // Tạo số thứ tự trong ngày
        const today = new Date().toISOString().slice(0, 10);
        const todayCount = await QueueEntry.countDocuments({ checkinDate: today });
        const queueNumber = todayCount + 1;

        const entry = await QueueEntry.create({
            patientName: patientName.trim(),
            patientPhone: patientPhone?.trim() || "",
            symptoms: symptoms.trim(),
            appointmentId: appointmentId || null,
            status: "pending",
            queueNumber,
            checkinDate: today,
        });

        return res.status(201).json({
            message: "Đăng ký thành công. Vui lòng chờ y tá gọi tên.",
            entry: {
                _id: entry._id,
                patientName: entry.patientName,
                queueNumber: entry.queueNumber,
                status: entry.status,
                createdAt: entry.createdAt,
            },
        });
    } catch (err) {
        console.error("createEntry error:", err);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

/**
 * GET /api/v1/queue
 * Auth required
 * - nurse/admin: tất cả entries hôm nay
 * - doctor: entries được gán cho mình (waiting | in_progress), FIFO
 */
exports.getEntries = async (req, res) => {
    try {
        const { role, id } = req.user;
        const today = new Date().toISOString().slice(0, 10);

        let filter = {};

        if (role === "doctor") {
            filter = {
                doctorId: id,
                status: { $in: ["waiting", "in_progress"] },
            };
        } else if (role === "nurse" || role === "admin") {
            filter = { checkinDate: today };
        } else {
            return res.status(403).json({ message: "Không có quyền truy cập" });
        }

        const entries = await QueueEntry.find(filter)
            .populate("doctorId", "name specialty avatarUrl")
            .sort({ createdAt: 1 }); // FIFO

        return res.status(200).json({ entries });
    } catch (err) {
        console.error("getEntries error:", err);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

/**
 * PATCH /api/v1/queue/:id/assign
 * Auth required — nurse/admin only
 * Y tá gán bác sĩ cho bệnh nhân
 * body: { doctorId, triageNotes? }
 */
exports.assignDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorId, triageNotes } = req.body;

        if (!doctorId) {
            return res.status(400).json({ message: "doctorId là bắt buộc" });
        }

        // Kiểm tra bác sĩ tồn tại
        const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
        if (!doctor) {
            return res.status(404).json({ message: "Bác sĩ không tồn tại" });
        }

        const entry = await QueueEntry.findById(id);
        if (!entry) {
            return res.status(404).json({ message: "Không tìm thấy bệnh nhân trong hàng đợi" });
        }

        if (entry.status !== "pending") {
            return res.status(400).json({ message: "Bệnh nhân đã được phân loại rồi" });
        }

        entry.doctorId = doctorId;
        entry.status = "waiting";
        if (triageNotes) entry.triageNotes = triageNotes.trim();
        await entry.save();

        const populated = await QueueEntry.findById(entry._id).populate("doctorId", "name specialty avatarUrl");

        return res.status(200).json({
            message: `Đã chuyển bệnh nhân sang hàng đợi của BS. ${doctor.name}`,
            entry: populated,
        });
    } catch (err) {
        console.error("assignDoctor error:", err);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

/**
 * PATCH /api/v1/queue/:id/status
 * Auth required — doctor/nurse/admin
 * Cập nhật trạng thái (in_progress, completed, cancelled)
 */
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { role } = req.user;

        const allowed = ["pending", "waiting", "in_progress", "completed", "cancelled"];
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({ message: "Status không hợp lệ" });
        }

        const entry = await QueueEntry.findById(id);
        if (!entry) {
            return res.status(404).json({ message: "Không tìm thấy bệnh nhân trong hàng đợi" });
        }

        entry.status = status;
        await entry.save();

        const populated = await QueueEntry.findById(entry._id).populate("doctorId", "name specialty avatarUrl");

        return res.status(200).json({
            message: "Cập nhật trạng thái thành công",
            entry: populated,
        });
    } catch (err) {
        console.error("updateStatus error:", err);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
};
