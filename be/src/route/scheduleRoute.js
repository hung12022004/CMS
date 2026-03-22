const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const scheduleController = require("../controllers/scheduleController");

// Nurse/Admin: lấy lịch bác sĩ (có filter ?doctorId=&startDate=&endDate=)
router.get("/", auth, authorize("nurse", "admin", "doctor"), scheduleController.getSchedules);

// Nurse/Admin: tạo hoặc cập nhật lịch (upsert)
router.put("/", auth, authorize("nurse", "admin"), scheduleController.upsertSchedule);

// Nurse/Admin: xóa lịch
router.delete("/:id", auth, authorize("nurse", "admin"), scheduleController.deleteSchedule);

module.exports = router;
