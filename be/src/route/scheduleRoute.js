const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const scheduleController = require("../controllers/scheduleController");

// Cấu hình multer để lưu file trên bộ nhớ tạm (phù hợp cho đọc file excel trực tiếp)
const upload = multer({ storage: multer.memoryStorage() });

// Nurse/Admin/Patient/Doctor: lấy lịch bác sĩ (có filter ?doctorId=&startDate=&endDate=)
router.get("/", auth, authorize("nurse", "admin", "doctor", "patient"), scheduleController.getSchedules);

// Nurse/Admin: tạo hoặc cập nhật lịch (upsert)
router.put("/", auth, authorize("nurse", "admin"), scheduleController.upsertSchedule);

// Nurse/Admin: import lịch từ file excel
router.post("/import", auth, authorize("nurse", "admin"), upload.single("file"), scheduleController.importSchedules);

// Nurse/Admin: xóa lịch
router.delete("/:id", auth, authorize("nurse", "admin"), scheduleController.deleteSchedule);

module.exports = router;
