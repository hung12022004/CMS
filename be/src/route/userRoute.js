const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { uploadAvatar } = require("../middlewares/upload");
const userController = require("../controllers/userController");

router.get("/me", auth, userController.getMe);
router.patch("/me", auth, userController.updateMe);
router.patch("/me/password", auth, userController.changePassword);

// Upload avatar
router.post("/me/avatar", auth, uploadAvatar.single("avatar"), userController.uploadAvatar);

// Lấy danh sách bệnh nhân (cho bác sĩ / y tá)
router.get("/patients", auth, authorize("doctor", "nurse", "admin"), userController.getPatients);

// Lấy danh sách bác sĩ (tất cả mọi người đều có thể xem)
router.get("/doctors", userController.getDoctors);
router.get("/doctors/:id", userController.getDoctorById);

module.exports = router;
