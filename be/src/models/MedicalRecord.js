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
        encounterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MedicalEncounter",
            default: null,
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
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        vitals: {
            weight: { type: String, default: "" },
            bloodPressure: { type: String, default: "" },
            heartRate: { type: String, default: "" },
            temperature: { type: String, default: "" },
        },
        status: {
            type: String,
            default: "Hoàn thành",
        },
        prescriptions: [{
            name: { type: String, required: true },
            dosage: { type: String, default: "" },
            duration: { type: String, default: "" },
            instructions: { type: String, default: "" },
        }],
        date: {
            type: String, // YYYY-MM-DD
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
