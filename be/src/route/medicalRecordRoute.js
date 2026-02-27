const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const medicalRecordController = require("../controllers/medicalRecordController");

router.get("/", auth, medicalRecordController.getMedicalRecords);
router.post("/", auth, authorize("doctor"), medicalRecordController.createMedicalRecord);

module.exports = router;
