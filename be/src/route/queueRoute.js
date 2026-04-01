const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const queueController = require("../controllers/queueController");

// Public — bệnh nhân check-in không cần đăng nhập
router.post("/", queueController.createEntry);

// Auth required
router.get("/", auth, authorize("nurse", "admin", "doctor"), queueController.getEntries);

// Nurse/admin: gán bác sĩ
router.patch("/:id/assign", auth, authorize("nurse", "admin"), queueController.assignDoctor);

// Doctor/nurse/admin: cập nhật trạng thái
router.patch("/:id/status", auth, authorize("doctor", "nurse", "admin"), queueController.updateStatus);

module.exports = router;
