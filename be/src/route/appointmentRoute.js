const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const appointmentController = require("../controllers/appointmentController");

router.get("/", auth, appointmentController.getAppointments);
router.post("/", auth, appointmentController.createAppointment);
router.patch("/:id", auth, appointmentController.updateAppointment); // Cập nhật chi tiết
router.patch("/:id/status", auth, authorize("doctor", "nurse", "admin"), appointmentController.updateStatus);

module.exports = router;
