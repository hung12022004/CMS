const DoctorSchedule = require("../models/DoctorSchedule");
const User = require("../models/User");
const xlsx = require("xlsx");

// ─── Shift presets ──────────────────────────────────────────────────────────
const SHIFT_PRESETS = {
    CA_SANG:  { startTime: "07:00", endTime: "12:00" },
    CA_CHIEU: { startTime: "13:00", endTime: "17:00" },
    CA_TOAN:  { startTime: "07:00", endTime: "17:00" },
    CA_TOI:   { startTime: "18:00", endTime: "22:00" },
    CA_DEM:   { startTime: "22:00", endTime: "06:00" },
};

// ─── Helper: map doctor name or email → User document ─────────────────────
const resolveDoctor = async (identifier, doctorCache) => {
    if (!identifier) return null;
    const key = identifier.toString().trim().toLowerCase();
    if (doctorCache[key]) return doctorCache[key];
    const doc = await User.findOne({
        role: "doctor",
        $or: [
            { email: key },
            { name: { $regex: `^${identifier.trim()}$`, $options: "i" } },
        ],
    }).select("_id name email");
    if (doc) doctorCache[key] = doc;
    return doc || null;
};

// ─── GET /api/v1/schedules ─────────────────────────────────────────────────
exports.getSchedules = async (req, res) => {
    try {
        const { doctorId, startDate, endDate } = req.query;
        const filter = {};
        if (doctorId) filter.doctorId = doctorId;
        if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
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

// ─── PUT /api/v1/schedules ─────────────────────────────────────────────────
exports.upsertSchedule = async (req, res) => {
    try {
        const { doctorId, date, isWorking, startTime, endTime, notes } = req.body;
        const createdBy = req.user.id;
        if (!doctorId || !date) return res.status(400).json({ message: "doctorId và date là bắt buộc" });
        const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
        if (!doctor) return res.status(404).json({ message: "Bác sĩ không tồn tại" });
        const update = { isWorking: isWorking !== undefined ? isWorking : true, createdBy };
        if (startTime) update.startTime = startTime;
        if (endTime) update.endTime = endTime;
        if (notes !== undefined) update.notes = notes;
        const schedule = await DoctorSchedule.findOneAndUpdate(
            { doctorId, date },
            { $set: update },
            { new: true, upsert: true, runValidators: true }
        ).populate("doctorId", "name specialty avatarUrl");
        return res.status(200).json({ message: "Đã cập nhật lịch làm việc", schedule });
    } catch (err) {
        console.error("upsertSchedule error:", err);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// ─── DELETE /api/v1/schedules/:id ─────────────────────────────────────────
exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await DoctorSchedule.findByIdAndDelete(id);
        if (!schedule) return res.status(404).json({ message: "Không tìm thấy lịch" });
        return res.status(200).json({ message: "Đã xóa lịch" });
    } catch (err) {
        console.error("deleteSchedule error:", err);
        return res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// ─── POST /api/v1/schedules/preview-excel ─────────────────────────────────
/**
 * Columns (flexible, supports Vietnamese or English headers):
 *   bacSi / doctorEmail / doctorName / Bác sĩ  → Tên hoặc email bác sĩ
 *   ngay  / date / Ngày                         → YYYY-MM-DD hoặc DD/MM/YYYY
 *   ca    / Ca / shiftCode                      → CA_SANG | CA_CHIEU | CA_TOAN | CA_TOI | CA_DEM
 *   batDau / startTime / Bắt đầu                → HH:mm (nếu không dùng mã ca)
 *   ketThuc / endTime / Kết thúc                → HH:mm
 *   ghiChu / notes / Ghi chú                   → (tùy chọn)
 */
exports.previewExcel = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Vui lòng chọn file Excel" });

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

        const validRecords = [];
        const errorRecords = [];
        const doctorCache = {};
        const today = new Date().toISOString().slice(0, 10);

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const rowNumber = i + 2;

            const identifier = (row["bacSi"]  || row["doctorEmail"] || row["doctorName"] || row["Bác sĩ"] || "").toString().trim();
            const dateRaw    = (row["ngay"]    || row["date"]       || row["Ngày"]        || "").toString().trim();
            const caCode     = (row["ca"]      || row["Ca"]         || row["shiftCode"]    || "").toString().trim().toUpperCase();
            const batDau     = (row["batDau"]  || row["startTime"]  || row["Bắt đầu"]     || "").toString().trim();
            const ketThuc    = (row["ketThuc"] || row["endTime"]    || row["Kết thúc"]    || "").toString().trim();
            const ghiChu     = (row["ghiChu"]  || row["notes"]      || row["Ghi chú"]     || "").toString().trim();

            if (!identifier || !dateRaw) {
                errorRecords.push({ rowNumber, raw: row, errorReason: "Thiếu Bác sĩ hoặc Ngày" });
                continue;
            }

            // --- Normalize Date ---
            let normalizedDate = dateRaw.toString().trim();

            // 1. Handle Excel Serial Numbers (e.g. 46122)
            if (!isNaN(normalizedDate) && !normalizedDate.includes("-") && !normalizedDate.includes("/")) {
                // Serial to JS Date: Excel starts from 1900-01-01, Unix starts from 1970-01-01
                const serial = Number(normalizedDate);
                const dateObj = new Date(Math.round((serial - 25569) * 86400 * 1000));
                normalizedDate = dateObj.toISOString().slice(0, 10);
            } 
            // 2. Handle DD/MM/YYYY or MM/DD/YYYY formats
            else if (normalizedDate.includes("/")) {
                const parts = normalizedDate.split("/");
                if (parts.length === 3) {
                    const p0 = parts[0].padStart(2, "0");
                    const p1 = parts[1].padStart(2, "0");
                    const p2 = parts[2];
                    
                    if (Number(p0) > 12) {
                        normalizedDate = `${p2}-${p1}-${p0}`; // DD/MM/YYYY
                    } else {
                        normalizedDate = `${p2}-${p0}-${p1}`; // MM/DD/YYYY (or DD/MM if first part <= 12)
                    }
                }
            }

            // Final validation (YYYY-MM-DD)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) || isNaN(new Date(normalizedDate).getTime())) {
                errorRecords.push({ rowNumber, raw: row, errorReason: `Định dạng ngày không hợp lệ: "${dateRaw}". Dùng YYYY-MM-DD hoặc DD/MM/YYYY` });
                continue;
            }

            if (normalizedDate < today) {
                errorRecords.push({ rowNumber, raw: row, errorReason: `Ngày ${normalizedDate} đã qua — chỉ được xếp lịch hiện tại hoặc tương lai` });
                continue;
            }

            // Resolve times
            let startTime, endTime;
            if (caCode && SHIFT_PRESETS[caCode]) {
                startTime = SHIFT_PRESETS[caCode].startTime;
                endTime   = SHIFT_PRESETS[caCode].endTime;
            } else {
                startTime = batDau;
                endTime   = ketThuc;
            }

            if (!startTime || !endTime) {
                errorRecords.push({ rowNumber, raw: row, errorReason: "Thiếu thời gian ca làm. Dùng mã ca (CA_SANG, CA_CHIEU...) hoặc điền HH:mm vào batDau/ketThuc" });
                continue;
            }

            if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
                errorRecords.push({ rowNumber, raw: row, errorReason: `Định dạng giờ sai: "${startTime}" - "${endTime}". Phải là HH:mm` });
                continue;
            }

            const doc = await resolveDoctor(identifier, doctorCache);
            if (!doc) {
                errorRecords.push({ rowNumber, raw: row, errorReason: `Không tìm thấy bác sĩ: "${identifier}". Kiểm tra lại tên hoặc email` });
                continue;
            }

            validRecords.push({
                doctorId:    doc._id.toString(),
                doctorName:  doc.name,
                doctorEmail: doc.email,
                date:        normalizedDate,
                shiftCode:   caCode || null,
                startTime,
                endTime,
                notes:       ghiChu,
                rowNumber,
            });
        }

        return res.status(200).json({ message: "Đọc file hoàn tất", validRecords, errorRecords });
    } catch (err) {
        console.error("previewExcel error:", err);
        return res.status(500).json({ message: "Lỗi xử lý file Excel", error: err.message });
    }
};

// ─── POST /api/v1/schedules/bulk-import ───────────────────────────────────
/**
 * Lưu validRecords với UPSERT (ghi đè nếu đã có lịch cùng bác sĩ + ngày)
 * Emit socket event "schedule:bulkImported" sau khi xong
 */
exports.bulkImport = async (req, res) => {
    try {
        const { validRecords } = req.body;
        if (!validRecords || validRecords.length === 0) {
            return res.status(400).json({ message: "Không có dữ liệu hợp lệ để lưu" });
        }
        const createdBy = req.user.id;

        const results = await Promise.all(
            validRecords.map((record) =>
                DoctorSchedule.findOneAndUpdate(
                    { doctorId: record.doctorId, date: record.date },
                    {
                        $set: {
                            startTime: record.startTime,
                            endTime:   record.endTime,
                            notes:     record.notes || "",
                            isWorking: true,
                            createdBy,
                        },
                    },
                    { new: true, upsert: true, runValidators: true }
                ).populate("doctorId", "name specialty avatarUrl")
            )
        );

        // Realtime broadcast
        const io = req.app.get("io");
        if (io) {
            io.emit("schedule:bulkImported", { count: results.length, importedBy: req.user.id });
        }

        return res.status(200).json({
            message: `Đã import ${results.length} lịch làm việc thành công`,
            count: results.length,
            schedules: results,
        });
    } catch (err) {
        console.error("bulkImport error:", err);
        return res.status(500).json({ message: "Lỗi lưu Database", error: err.message });
    }
};

// ─── POST /api/v1/schedules/import-excel (legacy compat) ─────────────────
exports.importExcel = async (req, res) => {
    // Redirect to bulkImport for backward compat
    return exports.bulkImport(req, res);
};
