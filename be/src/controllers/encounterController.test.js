const encounterController = require("./encounterController");
const MedicalEncounter = require("../models/MedicalEncounter");

jest.mock("../models/MedicalEncounter");

describe("encounterController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {
        encounterId: "enc123",
        serviceId: "srv456",
      },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("updateServiceStatus", () => {
    it("should return 400 for invalid status", async () => {
      req.body.status = "INVALID_STATUS";

      await encounterController.updateServiceStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Trạng thái không hợp lệ" });
    });

    it("should return 404 if encounter or service not found", async () => {
      req.body.status = "COMPLETED";
      MedicalEncounter.findOneAndUpdate.mockResolvedValue(null);

      await encounterController.updateServiceStatus(req, res);

      expect(MedicalEncounter.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "enc123", "services._id": "srv456" },
        { $set: { "services.$.status": "COMPLETED" } },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Không tìm thấy đợt khám hoặc dịch vụ" });
    });

    it("should update service status and return 200", async () => {
      req.body.status = "IN_PROGRESS";
      const mockUpdatedEncounter = {
        _id: "enc123",
        services: [{ _id: "srv456", status: "IN_PROGRESS" }],
      };
      MedicalEncounter.findOneAndUpdate.mockResolvedValue(mockUpdatedEncounter);

      await encounterController.updateServiceStatus(req, res);

      expect(MedicalEncounter.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "enc123", "services._id": "srv456" },
        { $set: { "services.$.status": "IN_PROGRESS" } },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Cập nhật trạng thái dịch vụ thành công",
        encounter: mockUpdatedEncounter,
      });
    });
  });
});
