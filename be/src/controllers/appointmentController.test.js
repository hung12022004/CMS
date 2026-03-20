const appointmentController = require("./appointmentController");
const Appointment = require("../models/Appointment");

jest.mock("../models/Appointment");

describe("appointmentController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: "user123", role: "patient" },
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("getAppointments", () => {
    it("should fetch appointments for a patient", async () => {
      const mockAppointments = [{ id: "apt1" }];
      const findMock = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockAppointments),
      };
      Appointment.find.mockReturnValue(findMock);

      await appointmentController.getAppointments(req, res);

      expect(Appointment.find).toHaveBeenCalledWith({ patientId: "user123" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ appointments: mockAppointments });
    });

    it("should fetch appointments for a doctor", async () => {
      req.user.role = "doctor";
      const mockAppointments = [{ id: "apt2" }];
      const findMock = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockAppointments),
      };
      Appointment.find.mockReturnValue(findMock);

      await appointmentController.getAppointments(req, res);

      expect(Appointment.find).toHaveBeenCalledWith({ doctorId: "user123" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ appointments: mockAppointments });
    });
  });

  describe("createAppointment", () => {
    it("should return 400 if required fields are missing", async () => {
      req.body = { date: "2026-03-20" }; // Missing doctorId and time

      await appointmentController.createAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Thiếu thông tin bác sĩ, ngày hoặc giờ khám" });
    });

    it("should create a new appointment and return 201", async () => {
      req.body = {
        doctorId: "doc456",
        date: "2026-03-20",
        time: "10:00",
        reason: "Checkup",
      };
      const mockNewApt = { ...req.body, patientId: req.user.id, status: "pending" };
      Appointment.create.mockResolvedValue(mockNewApt);

      await appointmentController.createAppointment(req, res);

      expect(Appointment.create).toHaveBeenCalledWith(expect.objectContaining({
        patientId: "user123",
        doctorId: "doc456",
        date: "2026-03-20",
        time: "10:00",
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Đặt lịch hẹn thành công",
        appointment: mockNewApt,
      }));
    });
  });
});
