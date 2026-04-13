const express = require("express");
const router = express.Router();
const serviceRequestController = require("../controllers/serviceRequestController");
const encounterGuard = require("../middlewares/encounterGuard");

// Giả định bảo vệ route bằng middleware chung
const auth = require("../middlewares/auth");

// Bác sĩ Cận lâm sàng lấy danh sách chờ
router.get(
  "/queue",
  auth,
  serviceRequestController.getQueue
);

// Bác sĩ Cận lâm sàng tiếp nhận dịch vụ
router.patch(
  "/:id/assign-me",
  auth,
  encounterGuard.verifyParaclinicalPermission,
  serviceRequestController.assignMe
);

// Bác sĩ Cận lâm sàng cập nhật kết quả
router.patch(
  "/:id/result",
  auth,
  encounterGuard.verifyParaclinicalPermission,
  encounterGuard.checkEncounterNotLocked,
  serviceRequestController.updateResult
);

module.exports = router;
