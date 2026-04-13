const encounterGuard = require("./encounterGuard");
const MedicalEncounter = require("../models/MedicalEncounter");
const ServiceRequest = require("../models/ServiceRequest");

jest.mock("../models/MedicalEncounter");
jest.mock("../models/ServiceRequest");

describe("encounterGuard middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { params: {}, body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("checkEncounterNotLocked", () => {
    it("should return 400 if no encounterId provided", async () => {
      await encounterGuard.checkEncounterNotLocked(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should fetch encounterId from ServiceRequest if serviceId is provided", async () => {
      req.params.serviceId = "srv1";
      ServiceRequest.findById.mockResolvedValue({ encounterId: "enc1", _id: "srv1" });
      MedicalEncounter.findById.mockResolvedValue({ _id: "enc1", isLocked: false });

      await encounterGuard.checkEncounterNotLocked(req, res, next);

      expect(ServiceRequest.findById).toHaveBeenCalledWith("srv1");
      expect(MedicalEncounter.findById).toHaveBeenCalledWith("enc1");
      expect(next).toHaveBeenCalled();
    });

    it("should return 403 if encounter is locked", async () => {
      req.params.encounterId = "enc2";
      MedicalEncounter.findById.mockResolvedValue({ _id: "enc2", isLocked: true });

      await encounterGuard.checkEncounterNotLocked(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Hồ sơ đã khóa, không thể chỉnh sửa" });
    });
  });

  describe("verifyParaclinicalPermission", () => {
    it("should return 401 if user not logged in", async () => {
      req.user = null;
      await encounterGuard.verifyParaclinicalPermission(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 403 if user is not PARACLINICAL_DOCTOR", async () => {
      req.user = { role: "CLINICAL_DOCTOR" };
      await encounterGuard.verifyParaclinicalPermission(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should return 403 if department does not match", async () => {
      req.user = { role: "PARACLINICAL_DOCTOR", department: "X_RAY" };
      req.serviceRequest = { targetDepartment: "LABORATORY" };

      await encounterGuard.verifyParaclinicalPermission(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should call next if role and department match", async () => {
      req.user = { role: "PARACLINICAL_DOCTOR", department: "X_RAY" };
      req.serviceRequest = { targetDepartment: "X_RAY" };

      await encounterGuard.verifyParaclinicalPermission(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
