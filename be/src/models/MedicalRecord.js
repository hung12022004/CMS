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
