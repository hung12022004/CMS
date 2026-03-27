const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
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
        date: {
            type: String, // String format YYYY-MM-DD for consistency with FE
            required: true,
        },
        time: {
            type: String, // String format HH:mm
            required: true,
        },
        type: {
            type: String,
            enum: ["clinic", "online"],
            default: "clinic",
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            default: "pending",
        },
        reason: {
            type: String,
            trim: true,
            default: "",
        },
        address: {
            type: String,
            trim: true,
            default: "",
        },
        paymentStatus: {
            type: String,
            enum: ["unpaid", "paid", "refunded"],
            default: "unpaid",
        },
        orderCode: {
            type: Number,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        review: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
