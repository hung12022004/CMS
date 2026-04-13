const mongoose = require("mongoose");

const doctorScheduleSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: String, // YYYY-MM-DD
            required: true,
        },
        isWorking: {
            type: Boolean,
            default: true,
        },
        startTime: {
            type: String, // HH:mm
            default: "08:00",
        },
        endTime: {
            type: String, // HH:mm
            default: "17:00",
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // nurse/admin who created
        },
    },
    { timestamps: true }
);

// Removed index to allow multiple shift schedules on the same day for time-overlap logic
// doctorScheduleSchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DoctorSchedule", doctorScheduleSchema);
