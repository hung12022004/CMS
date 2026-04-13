const express = require("express");
const router = express.Router();
const encounterController = require("../controllers/encounterController");
const encounterGuard = require("../middlewares/encounterGuard");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/uploadResult");

// Chi Clinical Doctor moi duoc tao (trong controller da check role them)
router.post(
  "/:encounterId/services",
  auth,
  encounterGuard.checkEncounterNotLocked,
  encounterController.createServiceRequest
);

router.post("/start", auth, encounterController.startEncounter);

router.patch(
  "/:encounterId/services/:serviceId/status",
  auth,
  upload.single("attachment"),
  encounterController.updateServiceStatus
);

router.get("/my-latest", auth, encounterController.getMyLatestEncounter);

router.get("/services/queue", auth, encounterController.getServiceQueue);

router.get("/patient/history", auth, encounterController.getPatientHistory);

router.get("/active/:patientId", auth, encounterController.getActiveEncounterByPatient);

router.get("/:encounterId", auth, encounterController.getEncounterById);

router.post(
  "/:encounterId/lock",
  auth,
  encounterGuard.checkEncounterNotLocked,
  encounterController.lockEncounter
);

module.exports = router;
