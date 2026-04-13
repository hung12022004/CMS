const mongoose = require("mongoose");
const MedicalEncounter = require("../models/MedicalEncounter");
const Room = require("../models/Room");
const socketConfig = require("../socket");
const STATUS_FLOW = {
  PENDING: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["COMPLETED", "CANCELED"],
  COMPLETED: [],
  CANCELED: [],
};

const normalizeStatus = (status) => String(status || "").toUpperCase();

exports.createServiceRequest = async (req, res) => {
  try {
    const { encounterId } = req.params;
    const { serviceType, assignedRoom, assignedDoctor } = req.body;

    if (req.user && req.user.role !== "CLINICAL_DOCTOR" && req.user.role !== "doctor") {
      return res
        .status(403)
        .json({ message: "Chỉ Bác sĩ Lâm sàng mới được quyền tạo chỉ định" });
    }

    if (!serviceType) {
      return res.status(400).json({ message: "Thiếu serviceType" });
    }

    const encounter = await MedicalEncounter.findById(encounterId);
    if (!encounter) {
      return res.status(404).json({ message: "Không tìm thấy đợt khám" });
    }

    if (encounter.isLocked) {
      return res.status(403).json({ message: "Hồ sơ đã khóa, không thể tạo chỉ định" });
    }

        let assignedRoomId = null;
    if (assignedRoom) {
      if (mongoose.Types.ObjectId.isValid(assignedRoom)) {
        assignedRoomId = assignedRoom;
      } else {
        const roomDoc = await Room.findOneAndUpdate(
          { name: assignedRoom },
          { name: assignedRoom },
          { new: true, upsert: true }
        );
        assignedRoomId = roomDoc._id;
      }
    }

    encounter.services.push({
      serviceType,
      status: "PENDING",
      assignedRoom: assignedRoomId,
      assignedDoctor: assignedDoctor || null,
    });

    await encounter.save();
    await encounter.populate("services.assignedRoom", "name department");

    const createdService = encounter.services[encounter.services.length - 1];

    // Bắn sự kiện Socket
    try {
      const io = socketConfig.getIO();
      // Bắn về room của bệnh nhân
      io.to(`room_patient_${encounter.patientId}`).emit("service_assigned", createdService);
      // Bắn về room của khoa (ví dụ: X_RAY, VITALS)
      io.to(`room_dept_${serviceType}`).emit("new_service_request", {
        ...createdService.toObject(),
        encounterId: encounter._id,
        patientId: encounter.patientId
      });
      // Bắn về room của bác sĩ chính
      io.to(`room_doctor_${encounter.clinicalDoctorId}`).emit("patient_progress_updated", createdService);
    } catch (sErr) {
      console.error("Socket emit error:", sErr.message);
    }

    res.status(201).json({
      message: "Tạo chỉ định thành công",
      service: createdService,
      encounterId: encounter._id,
    });
  } catch (error) {
    console.error("Lỗi tạo chỉ định:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

exports.updateServiceStatus = async (req, res) => {
  try {
    const { encounterId, serviceId } = req.params;
    const { status, resultData, resultImageUrl } = req.body;
    const nextStatus = normalizeStatus(status);

    if (!STATUS_FLOW[nextStatus] && nextStatus !== "PENDING") {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const encounter = await MedicalEncounter.findById(encounterId);
    if (!encounter) {
      return res.status(404).json({ message: "Không tìm thấy đợt khám" });
    }

    if (encounter.isLocked) {
      return res.status(403).json({ message: "Hồ sơ đã khóa, không thể cập nhật" });
    }

    const service = encounter.services.id(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }

    const currentStatus = service.status;
    if (currentStatus === nextStatus) {
      return res.status(200).json({ message: "Trạng thái không đổi", service });
    }

    const allowed = STATUS_FLOW[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({
        message: `Không thể chuyển từ ${currentStatus} sang ${nextStatus}`,
      });
    }

    service.status = nextStatus;
    
    // Lưu thông tin người thực hiện
    if (nextStatus === "IN_PROGRESS" && !service.assignedDoctor && req.user?.id) {
      service.assignedDoctor = req.user.id;
    }

    // Lưu kết quả (hỗ trợ lưu nháp khi IN_PROGRESS)
    if (nextStatus === "COMPLETED" || nextStatus === "IN_PROGRESS") {
      if (resultData !== undefined) service.resultData = resultData;
      if (resultImageUrl !== undefined) service.resultImageUrl = resultImageUrl;
      // Lưu tệp đính kèm nếu bác sĩ đã upload file
      if (req.file) {
        service.attachmentUrl = `/uploads/results/${req.file.filename}`;
        service.attachmentName = req.file.originalname;
      }
    }

    await encounter.save();
    await encounter.populate("services.assignedRoom", "name department");
    
    // Tìm lại service sau khi populate để emit
    const populatedService = encounter.services.id(serviceId);

    // Bắn sự kiện Socket
    try {
      const io = socketConfig.getIO();
      // Bắn về room của bệnh nhân
      io.to(`room_patient_${encounter.patientId}`).emit("service_status_changed", populatedService);
      // Bắn về room của khoa
      io.to(`room_dept_${populatedService.serviceType}`).emit("service_updated_in_kanban", {
        ...populatedService.toObject(),
        encounterId: encounter._id,
        patientId: encounter.patientId
      });
      // Bắn về room của bác sĩ chính
      io.to(`room_doctor_${encounter.clinicalDoctorId}`).emit("patient_progress_updated", populatedService);
    } catch (sErr) {
      console.error("Socket emit error:", sErr.message);
    }

    res.status(200).json({ message: "Cập nhật trạng thái thành công", service: populatedService });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

exports.startEncounter = async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Thiếu patientId" });
    }

    const role = req.user?.role;
    if (role !== "doctor" && role !== "CLINICAL_DOCTOR") {
      return res.status(403).json({ message: "Không có quyền tạo đợt khám" });
    }

    const today = new Date().toISOString().slice(0, 10);
    let encounter = await MedicalEncounter.findOne({
      patientId,
      clinicalDoctorId: req.user.id,
      isLocked: false,
      status: { $in: ["PENDING", "IN_PROGRESS"] },
      date: today,
    }).populate("services.assignedRoom", "name department");

    if (!encounter) {
      encounter = await MedicalEncounter.create({
        patientId,
        clinicalDoctorId: req.user.id,
        date: today,
        services: [],
        status: "PENDING",
      });
    }

    res.status(200).json({ encounter });
  } catch (error) {
    console.error("Lỗi start encounter:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

exports.getEncounterById = async (req, res) => {
  try {
    const { encounterId } = req.params;
    const encounter = await MedicalEncounter.findById(encounterId)
      .populate("patientId", "name email phoneNumber")
      .populate("clinicalDoctorId", "name email phoneNumber")
      .populate("services.assignedDoctor", "name email")
      .populate("services.assignedRoom", "name department");

    if (!encounter) {
      return res.status(404).json({ message: "Không tìm thấy đợt khám" });
    }

    res.status(200).json({ encounter });
  } catch (error) {
    console.error("Lỗi lấy đợt khám:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

exports.getMyLatestEncounter = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    let filter = {};
    if (user.role === "patient") {
      filter.patientId = user.id;
    } else if (user.role === "doctor" || user.role === "CLINICAL_DOCTOR") {
      filter.clinicalDoctorId = user.id;
    } else {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const encounter = await MedicalEncounter.findOne(filter)
      .sort({ createdAt: -1 })
      .populate("patientId", "name email phoneNumber")
      .populate("clinicalDoctorId", "name email phoneNumber")
      .populate("services.assignedDoctor", "name email")
      .populate("services.assignedRoom", "name department");

    if (!encounter) {
      return res.status(200).json({ encounter: null });
    }

    res.status(200).json({ encounter });
  } catch (error) {
    console.error("Lỗi lấy đợt khám gần nhất:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

exports.getActiveEncounterByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const today = new Date().toISOString().slice(0, 10);
    
    // Tìm đợt khám trong ngày, chưa bị khóa/hoàn thành của bệnh nhân do bác sĩ này khám
    const encounter = await MedicalEncounter.findOne({
      patientId,
      clinicalDoctorId: req.user.id,
      isLocked: false,
      status: { $in: ["PENDING", "IN_PROGRESS"] },
      date: today,
    }).sort({ createdAt: -1 })
      .populate("services.assignedRoom", "name department");

    if (!encounter) {
      return res.status(200).json({ encounter: null }); // Không lỗi, chỉ là không có
    }

    res.status(200).json({ encounter });
  } catch (error) {
    console.error("Lỗi lấy đợt khám active:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

exports.getPatientHistory = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "patient") {
      return res.status(403).json({ message: "Chỉ bệnh nhân mới được xem lịch sử." });
    }

    const encounters = await MedicalEncounter.find({ patientId: user.id })
      .sort({ createdAt: -1 })
      .populate("clinicalDoctorId", "name email phoneNumber")
      .populate("services.assignedRoom", "name department");

    res.status(200).json({ encounters });
  } catch (error) {
    console.error("Lỗi lấy lịch sử đợt khám:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

exports.getServiceQueue = async (req, res) => {
  try {
    const { serviceType, status } = req.query;

    if (!serviceType) {
      return res.status(400).json({ message: "Thiếu serviceType" });
    }

    const match = {
      "services.serviceType": serviceType,
    };

    if (status) {
      match["services.status"] = normalizeStatus(status);
    }

    const queue = await MedicalEncounter.aggregate([
      { $unwind: "$services" },
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          encounterId: "$_id",
          patientId: "$patientId",
          patientName: "$patient.name",
          patientPhone: "$patient.phoneNumber",
          service: "$services",
          date: 1,
        },
      },
      { $sort: { "service.createdAt": 1 } },
    ]);

    res.status(200).json({ queue });
  } catch (error) {
    console.error("Lỗi get queue:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

exports.lockEncounter = async (req, res) => {
  try {
    const { encounterId } = req.params;

    if (req.user && req.user.role !== "CLINICAL_DOCTOR") {
      return res
        .status(403)
        .json({ message: "Chỉ Bác sĩ Lâm sàng mới được quyền Chốt/Khóa hồ sơ" });
    }

    const encounter = await MedicalEncounter.findByIdAndUpdate(
      encounterId,
      { isLocked: true, status: "COMPLETED" },
      { new: true }
    );

    res.status(200).json({ message: "Đã chốt và khóa hồ sơ", encounter });
  } catch (error) {
    console.error("Lỗi lock hồ sơ:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};
