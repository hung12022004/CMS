const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

// Overview report (doctor + admin)
router.get(
  "/overview",
  auth,
  authorize("admin", "ADMIN", "doctor", "DOCTOR", "CLINICAL_DOCTOR", "PARACLINICAL_DOCTOR"),
  reportController.getOverviewReport
);

// Doctor performance leaderboard (admin only)
router.get(
  "/doctor-performance",
  auth,
  authorize("admin", "ADMIN"),
  reportController.getDoctorPerformance
);

// Service analytics pie chart (admin only)
router.get(
  "/service-analytics",
  auth,
  authorize("admin", "ADMIN"),
  reportController.getServiceAnalytics
);

module.exports = router;
