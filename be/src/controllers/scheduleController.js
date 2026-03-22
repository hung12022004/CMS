const DoctorSchedule = require("../models/DoctorSchedule");
const User = require("../models/User");

/**
 * GET /api/v1/schedules?week=YYYY-WW
 * Lấy lịch tất cả bác sĩ trong tuần (nurse/admin)
 * Hoặc lấy lịch của 1 bác sĩ cụ thể với doctorId query
 */
exports.getSchedules = async (req, res) => {
    try {
        const { doctorId, startDate, endDate } = req.query;

        const filter = {};
        if (doctorId) filter.doctorId = doctorId;

        // Accept date range
        if (startDate && endDate) {
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const schedules = await DoctorSchedule.find(filter)
            .populate("doctorId", "name specialty avatarUrl")
            .populate("createdBy", "name")
            .sort({ date: 1 });

        return res.status(200).json({ schedules });
    } catch (err) {
        console.error("getSchedules error:", err);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

/**
 * PUT /api/v1/schedules
 * Nurse tạo hoặc cập nhật lịch bác sĩ (upsert per doctorId + date)
 * body: { doctorId, date, isWorking, startTime?, endTime?, notes? }
 */
exports.upsertSchedule = async (req, res) => {
    try {
        const { doctorId, date, isWorking, startTime, endTime, notes } = req.body;
        const createdBy = req.user.id;

        if (!doctorId || !date) {
            return res.status(400).json({ message: "doctorId và date là bắt buộc" });
        }

        // Verify doctor exists
        const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
        if (!doctor) {
            return res.status(404).json({ message: "Bác sĩ không tồn tại" });
        }

        const update = {
            isWorking: isWorking !== undefined ? isWorking : true,
            createdBy,
        };
        if (startTime) update.startTime = startTime;
        if (endTime) update.endTime = endTime;
        if (notes !== undefined) update.notes = notes;

        const schedule = await DoctorSchedule.findOneAndUpdate(
            { doctorId, date },
            { $set: update },
            { new: true, upsert: true, runValidators: true }
        ).populate("doctorId", "name specialty avatarUrl");

        return res.status(200).json({
            message: "Đã cập nhật lịch làm việc",
            schedule,
        });
    } catch (err) {
        console.error("upsertSchedule error:", err);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

/**
 * DELETE /api/v1/schedules/:id
 * Xóa 1 slot lịch
 */
exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await DoctorSchedule.findByIdAndDelete(id);
        if (!schedule) {
            return res.status(404).json({ message: "Không tìm thấy lịch" });
        }
        return res.status(200).json({ message: "Đã xóa lịch" });
    } catch (err) {
        console.error("deleteSchedule error:", err);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
};
