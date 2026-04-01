const DoctorSchedule = require("../models/DoctorSchedule");
const User = require("../models/User");
const xlsx = require("xlsx");

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
 * POST /api/v1/schedules/import
 * Import lịch làm việc từ file Excel/CSV
 * FormData: { file, startDate (YYYY-MM-DD) }
 * Yêu cầu cài đặt thư viện: npm install xlsx multer
 */
exports.importSchedules = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Vui lòng tải lên file Excel/CSV" });
        }

        const { startDate } = req.body;
        if (!startDate) {
            return res.status(400).json({ message: "Vui lòng cung cấp ngày bắt đầu (T2) của tuần (startDate, định dạng YYYY-MM-DD)" });
        }

        // Tính các ngày trong tuần từ startDate
        const start = new Date(startDate);
        const weekDates = []; // [T2, T3, T4, T5, T6, T7, CN]
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            weekDates.push(date.toISOString().slice(0, 10)); // YYYY-MM-DD
        }

        // Đọc dữ liệu từ file upload trên bộ nhớ (cần cấu hình multer bằng memoryStorage ở route)
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const createdBy = req.user.id;
        let importedDoctorsCount = 0;

        const daysMapKeys = ["t2", "t3", "t4", "t5", "t6", "t7", "cn"];

        for (const row of data) {
            // Chuẩn hóa tên cột trong Excel (chuyển về chữ thường và xóa khoảng trắng dư thừa)
            const normalizedRow = {};
            for (const key in row) {
                normalizedRow[key.trim().toLowerCase()] = row[key];
            }

            const doctorName = normalizedRow["họ và tên"];
            // Bỏ qua dòng rỗng hoặc dòng tổng kết
            if (!doctorName || String(doctorName).toLowerCase().startsWith("số bs đi làm")) continue;

            // Tên trong file có thể có "BS. " hoặc "BS ", cần loại bỏ để khớp với tên trong DB
            const cleanName = String(doctorName).replace(/^BS\.?\s*/i, "").trim();
            
            // Tìm bác sĩ trong DB bằng Regex để khớp gần đúng
            const doctor = await User.findOne({ 
                role: "doctor", 
                name: { $regex: new RegExp(cleanName, "i") } 
            });

            if (!doctor) {
                console.log(`Bỏ qua: Không tìm thấy bác sĩ với tên "${cleanName}"`);
                continue;
            }
            
            importedDoctorsCount++;

            for (let i = 0; i < daysMapKeys.length; i++) {
                const dayKey = daysMapKeys[i];
                const dateStr = weekDates[i];
                
                // Cột có đánh dấu 'X' (hoặc 'x') là đi làm
                const cellValue = normalizedRow[dayKey];
                const isWorking = cellValue ? String(cellValue).trim().toLowerCase() === "x" : false;

                await DoctorSchedule.findOneAndUpdate(
                    { doctorId: doctor._id, date: dateStr },
                    {
                        $set: {
                            isWorking,
                            createdBy,
                            // Gán thời gian mặc định nếu đi làm, nếu nghỉ thì xóa khung giờ trống
                            ...(isWorking ? { startTime: "08:00", endTime: "17:00" } : { startTime: "", endTime: "" })
                        }
                    },
                    { new: true, upsert: true, runValidators: true }
                );
            }
        }

        return res.status(200).json({ 
            message: `Import thành công. Đã cập nhật lịch làm việc cho ${importedDoctorsCount} bác sĩ trong tuần bắt đầu từ ${startDate}.`,
        });

    } catch (err) {
        console.error("importSchedules error:", err);
        return res.status(500).json({ message: "Lỗi máy chủ khi đọc file import" });
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
