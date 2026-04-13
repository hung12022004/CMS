const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const scheduleController = require("../controllers/scheduleController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// Nurse/Admin/Patient/Doctor: lấy lịch bác sĩ
router.get("/", auth, authorize("nurse", "admin", "doctor", "patient"), scheduleController.getSchedules);

// Nurse/Admin: tạo hoặc cập nhật lịch (upsert)
router.put("/", auth, authorize("nurse", "admin"), scheduleController.upsertSchedule);

// Nurse/Admin: xóa lịch
router.delete("/:id", auth, authorize("nurse", "admin"), scheduleController.deleteSchedule);

// Admin/Nurse: Preview Excel (parse + validate, không lưu DB)
router.post("/preview-excel", auth, authorize("admin", "nurse"), upload.single("file"), scheduleController.previewExcel);

// Admin/Nurse: Bulk import với upsert + socket emit
router.post("/bulk-import", auth, authorize("admin", "nurse"), scheduleController.bulkImport);

// Legacy: import-excel (redirects to bulkImport)
router.post("/import-excel", auth, authorize("admin", "nurse"), scheduleController.importExcel);

module.exports = router;
