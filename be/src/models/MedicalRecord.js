const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        diagnosis: {
            type: String,
            required: true,
            trim: true,
        },
        symptoms: {
            type: [String],
            default: [],
        },
        tests: [
            {
                name: { type: String, trim: true },
                result: { type: String, trim: true },
            }
        ],
        vitals: {
            weight: { type: String, trim: true, default: "" },
            bloodPressure: { type: String, trim: true, default: "" },
            heartRate: { type: String, trim: true, default: "" },
            temperature: { type: String, trim: true, default: "" }
        },
        prescriptions: [
            {
                name: { type: String, trim: true },
                dosage: { type: String, trim: true },
                duration: { type: String, trim: true },
            }
        ],
        attachments: [
            {
                name: { type: String, trim: true },
                fileUrl: { type: String, trim: true },
            }
        ],
        status: {
            type: String,
            enum: ['completed', 'pending_test_results'],
            default: 'completed',
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        date: {
            type: String, // YYYY-MM-DD
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
