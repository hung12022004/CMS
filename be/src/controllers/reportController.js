const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");
const MedicalEncounter = require("../models/MedicalEncounter");
const mongoose = require("mongoose");

// Helper: Disable 304 caching
const noCache = (res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
};

// GET /api/v1/reports/overview
exports.getOverviewReport = async (req, res) => {
  try {
    noCache(res);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp startDate và endDate (YYYY-MM-DD)" });
    }

    const match = {
      date: { $gte: startDate, $lte: endDate },
      paymentStatus: "paid",
    };

    const role = req.user?.role;
    if (role === "doctor" || role === "DOCTOR" || role === "CLINICAL_DOCTOR" || role === "PARACLINICAL_DOCTOR") {
      match.doctorId = new mongoose.Types.ObjectId(req.user.id);
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: "$date",
          patients: { $sum: 1 },
          revenue: { $sum: 300000 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$revenue" },
          totalPatients: { $sum: "$patients" },
          dailyRevenue: {
            $push: {
              date: "$_id",
              patients: "$patients",
              revenue: "$revenue"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalPatients: 1,
          dailyRevenue: 1
        }
      }
    ];

    const result = await Appointment.aggregate(pipeline);

    if (result.length === 0) {
      return res.status(200).json({ totalRevenue: 0, totalPatients: 0, dailyRevenue: [] });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error("error trong getOverviewReport:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

// GET /api/v1/reports/doctor-performance
exports.getDoctorPerformance = async (req, res) => {
  try {
    noCache(res);
    const { startDate, endDate } = req.query;

    // Use same source as overview: Appointment with paymentStatus: "paid"
    const matchStage = { paymentStatus: "paid" };
    if (startDate && endDate) {
      matchStage.date = { $gte: startDate, $lte: endDate };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$doctorId",
          completedCases: { $sum: 1 },
          // Revenue: same fixed rate as overview (300k per paid appointment)
          estimatedRevenue: { $sum: 300000 },
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: 1,
          completedCases: 1,
          estimatedRevenue: 1,
          doctorName: "$doctorInfo.name",
          doctorEmail: "$doctorInfo.email",
          doctorAvatar: "$doctorInfo.avatarUrl",
        }
      },
      { $sort: { completedCases: -1 } },
      { $limit: 20 }
    ];

    const result = await Appointment.aggregate(pipeline);
    res.status(200).json({ doctors: result });
  } catch (error) {
    console.error("getDoctorPerformance error:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

// GET /api/v1/reports/service-analytics
exports.getServiceAnalytics = async (req, res) => {
  try {
    noCache(res);
    const { startDate, endDate } = req.query;

    const SERVICE_LABELS = {
      VITALS: "Sinh hiệu",
      BLOOD_TEST: "Xét nghiệm máu",
      DENTAL: "Răng Hàm Mặt",
      X_RAY: "Chụp X-Quang",
      ULTRASOUND: "Siêu âm",
      clinic: "Khám tại phòng khám",
      online: "Khám trực tuyến",
    };

    // 1. Group paid Appointments by type (clinic / online)
    const apptMatch = { paymentStatus: "paid" };
    if (startDate && endDate) apptMatch.date = { $gte: startDate, $lte: endDate };

    const apptResult = await Appointment.aggregate([
      { $match: apptMatch },
      {
        $group: {
          _id: "$type",
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          pending:   { $sum: { $cond: [{ $in:  ["$status", ["pending", "confirmed"]] }, 1, 0] } },
        }
      },
      { $sort: { total: -1 } }
    ]);

    // 2. Group MedicalEncounter services by serviceType (paraclinical)
    const encMatch = {};
    if (startDate && endDate) encMatch.date = { $gte: startDate, $lte: endDate };

    const encResult = await MedicalEncounter.aggregate([
      { $match: encMatch },
      { $unwind: "$services" },
      {
        $group: {
          _id: "$services.serviceType",
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$services.status", "COMPLETED"] }, 1, 0] } },
          pending:   { $sum: { $cond: [{ $eq: ["$services.status", "PENDING"]    }, 1, 0] } },
        }
      },
      { $sort: { total: -1 } }
    ]);

    // 3. Merge both result sets
    const mergedMap = {};
    for (const item of apptResult) {
      mergedMap[item._id] = { ...item, label: SERVICE_LABELS[item._id] || item._id };
    }
    for (const item of encResult) {
      if (mergedMap[item._id]) {
        mergedMap[item._id].total     += item.total;
        mergedMap[item._id].completed += item.completed;
        mergedMap[item._id].pending   += item.pending;
      } else {
        mergedMap[item._id] = { ...item, label: SERVICE_LABELS[item._id] || item._id };
      }
    }

    const formatted = Object.values(mergedMap).sort((a, b) => b.total - a.total);
    res.status(200).json({ services: formatted });
  } catch (error) {
    console.error("getServiceAnalytics error:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

