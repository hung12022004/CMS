const mongoose = require("mongoose");

const queueEntrySchema = new mongoose.Schema(
    {
        patientName: {
            type: String,
            required: true,
            trim: true,
        },
        patientPhone: {
            type: String,
            trim: true,
            default: "",
        },
        symptoms: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "waiting", "in_progress", "completed", "cancelled"],
            default: "pending",
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            default: null,
        },
        triageNotes: {
            type: String,
            trim: true,
            default: "",
        },
        roomNumber: {
            type: String,
            trim: true,
            default: "",
        },
        queueNumber: {
            type: Number,
            default: 0,
        },
        checkinDate: {
            type: String, // YYYY-MM-DD for daily queue reset
            default: () => new Date().toISOString().slice(0, 10),
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("QueueEntry", queueEntrySchema);
