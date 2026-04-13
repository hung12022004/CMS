const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: true,
      enum: ["VITALS", "BLOOD_TEST", "DENTAL", "X_RAY", "ULTRASOUND"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELED"],
      default: "PENDING",
    },
    assignedRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resultData: {
      type: String,
      default: "",
    },
    resultImageUrl: {
      type: String,
      default: "",
    },
    attachmentUrl: {
      type: String,
      default: "",
    },
    attachmentName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const medicalEncounterSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clinicalDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    diagnosis: {
      type: String,
      default: "",
    },
    prescription: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELED"],
      default: "PENDING",
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    services: {
      type: [serviceSchema],
      default: [],
    },
    date: {
      type: String, // YYYY-MM-DD
      default: () => new Date().toISOString().slice(0, 10),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalEncounter", medicalEncounterSchema);
