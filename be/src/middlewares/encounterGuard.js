const MedicalEncounter = require("../models/MedicalEncounter");
const ServiceRequest = require("../models/ServiceRequest");

/**
 * Middleware: Kiểm tra Encounter đã khóa chưa (Lock Mechanism).
 * Sử dụng `req.params.encounterId` hoặc tìm `encounterId` nếu nhận `serviceId`.
 */
exports.checkEncounterNotLocked = async (req, res, next) => {
  try {
    let encounterId = req.params.encounterId || req.body.encounterId;

    // Nếu route dùng `serviceId` thay vì `encounterId`, ta cần tra cứu ServiceRequest trước
    if (!encounterId && req.params.serviceId) {
      const service = await ServiceRequest.findById(req.params.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
      }
      encounterId = service.encounterId;
      // Truyền xuống req để các middleware/controller sau sử dụng lại
      req.serviceRequest = service;
    }

    if (!encounterId && req.params.id) {
       const service = await ServiceRequest.findById(req.params.id);
       if (!service) {
         return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
       }
       encounterId = service.encounterId;
       req.serviceRequest = service;
    }

    if (!encounterId) {
      return res.status(400).json({ message: "Thiếu encounterId để kiểm tra khóa hồ sơ" });
    }

    const encounter = await MedicalEncounter.findById(encounterId);
    if (!encounter) {
      return res.status(404).json({ message: "Không tìm thấy đợt khám (Encounter)" });
    }

    if (encounter.isLocked) {
      return res.status(403).json({ message: "Hồ sơ đã khóa, không thể chỉnh sửa" });
    }

    req.encounter = encounter;
    next();
  } catch (error) {
    console.error("Lỗi trong checkEncounterNotLocked:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};

/**
 * Middleware: Xác thực phòng ban của Bác sĩ Cận lâm sàng (verifyParaclinicalPermission).
 * Bắt buộc req.user đã tồn tại (sau bước check authenticate).
 */
exports.verifyParaclinicalPermission = async (req, res, next) => {
  try {
    const user = req.user; // Thông tin từ authenticate middleware
    
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    if (user.role !== "PARACLINICAL_DOCTOR") {
      return res.status(403).json({ message: "Yêu cầu quyền Bác sĩ Cận lâm sàng" });
    }

    let service = req.serviceRequest;
    if (!service) {
      const serviceId = req.params.serviceId || req.params.id;
      service = await ServiceRequest.findById(serviceId);
      if (!service) {
         return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
      }
      req.serviceRequest = service;
    }

    // Kiểm tra department của user có khớp với targetDepartment của phiếu hay không
    if (user.department !== service.targetDepartment) {
      return res.status(403).json({ 
        message: `Chỉ Bác sĩ thuộc khoa ${service.targetDepartment} mới được xử lý dịch vụ này` 
      });
    }

    next();
  } catch (error) {
    console.error("Lỗi trong verifyParaclinicalPermission:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};
