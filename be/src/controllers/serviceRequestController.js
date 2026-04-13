const ServiceRequest = require("../models/ServiceRequest");
const MedicalEncounter = require("../models/MedicalEncounter");

exports.getQueue = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "PARACLINICAL_DOCTOR") {
      return res.status(403).json({ message: "Chỉ Bác sĩ Cận lâm sàng mới có quyền xem hàng đợi" });
    }

    const services = await ServiceRequest.find({
      targetDepartment: user.department,
      status: "PENDING"
    }).populate("encounterId");

    res.status(200).json({ queue: services });
  } catch (error) {
    console.error("Lỗi get queue:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

exports.assignMe = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // verifyParaclinicalPermission đã chạy, ta biết chắc user là Bác sĩ cận lâm sàng thuộc khoa này.
    const service = req.serviceRequest; // Được gán từ middleware

    if (service.status !== "PENDING") {
      return res.status(400).json({ message: "Dịch vụ đã được thụ lý hoặc đã hoàn thành" });
    }

    service.executedBy = user._id;
    service.status = "IN_PROGRESS";
    await service.save();

    res.status(200).json({ message: "Tiếp nhận dịch vụ thành công", service });
  } catch (error) {
    console.error("Lỗi assign:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

exports.updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { resultData } = req.body;
    const user = req.user;

    const service = req.serviceRequest;

    // Tầng 2: Kiểm tra executedBy
    if (!service.executedBy || service.executedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Bạn không phải người tiếp nhận dịch vụ này" });
    }

    // Tầng 3: Trạng thái phiếu phải là IN_PROGRESS
    if (service.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "Dịch vụ không ở trạng thái đang thực hiện" });
    }

    service.resultData = resultData;
    service.status = "COMPLETED";
    await service.save();

    res.status(200).json({ message: "Cập nhật kết quả thành công", service });
  } catch (error) {
    console.error("Lỗi update result:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};
