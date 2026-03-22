const MedicalRecord = require("../models/MedicalRecord");
const User = require("../models/User");
const { sendMedicalRecordEmail } = require("../utils/mailer");

// GET /api/v1/medical-records
exports.getMedicalRecords = async (req, res) => {
    try {
        const { role, id } = req.user;
        let filter = {};

        if (role === "patient") {
            filter.patientId = id;
        } else if (role === "doctor") {
            filter.doctorId = id; // Doctor can see records they created, or we can allow seeing all for assigned patients
        } else if (role === "nurse" || role === "admin") {
            filter = {};
        }

        const records = await MedicalRecord.find(filter)
            .populate("patientId", "name email phoneNumber gender avatarUrl")
            .populate("doctorId", "name email phoneNumber avatarUrl")
            .sort({ date: -1, createdAt: -1 });

        return res.status(200).json({ records });
    } catch (err) {
        console.error("getMedicalRecords error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// POST /api/v1/medical-records
exports.createMedicalRecord = async (req, res) => {
    try {
        const { patientId, diagnosis, symptoms, notes, date, vitals, status, prescriptions } = req.body;
        const doctorId = req.user.id;
 
        if (!patientId || !diagnosis || !date) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
        }
 
        const newRecord = await MedicalRecord.create({
            patientId,
            doctorId,
            diagnosis,
            symptoms: symptoms || [],
            notes: notes || "",
            date,
            vitals: vitals || {},
            status: status || "Hoàn thành",
            prescriptions: prescriptions || [],
        });

        // Send email notification to patient
        try {
            const patient = await User.findById(patientId);
            const doctor = await User.findById(doctorId);
            if (patient && patient.email) {
                sendMedicalRecordEmail({
                    to: patient.email,
                    patientName: patient.name,
                    doctorName: doctor ? doctor.name : "Bác sĩ",
                    date: date,
                    diagnosis: diagnosis
                }).catch(err => console.error("Email notification background error:", err));
            }
        } catch (mailErr) {
            console.error("Failed to prepare email notification:", mailErr);
        }

        return res.status(201).json({
            message: "Tạo hồ sơ bệnh án thành công",
            record: newRecord,
        });
    } catch (err) {
        console.error("createMedicalRecord error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
