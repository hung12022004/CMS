const { previewExcel } = require("./scheduleController");
const User = require("../models/User");
const DoctorSchedule = require("../models/DoctorSchedule");
const xlsx = require("xlsx");

jest.mock("../models/User");
jest.mock("../models/DoctorSchedule");
jest.mock("xlsx", () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}));

describe("scheduleController.previewExcel", () => {
  let req, res;

  beforeEach(() => {
    req = { file: { buffer: Buffer.from("dummy") } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  it("should process and detect overlap correctly", async () => {
    // Mock file input data
    const mockExcelData = [
      { doctorEmail: "doc1@test.com", date: "2026-03-25", startTime: "09:00", endTime: "11:00" }, // Trùng lịch (overlap with 08:00->10:00)
      { doctorEmail: "doc1@test.com", date: "2026-03-25", startTime: "13:00", endTime: "15:00" }, // Ko trùng
    ];

    xlsx.read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } });
    xlsx.utils.sheet_to_json.mockReturnValue(mockExcelData);

    // Mock User find
    const docUser = { _id: "docId_123", name: "Doc1", email: "doc1@test.com" };
    User.findOne.mockReturnValue(docUser);

    // Mock DB Schedules (existing schedule is 08:00 - 10:00)
    DoctorSchedule.find.mockReturnValue([
      { startTime: "08:00", endTime: "10:00" }
    ]);

    await previewExcel(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArgs = res.json.mock.calls[0][0];
    
    // Bản ghi 1 (09:00 - 11:00) => Error vì (9 < 10 && 11 > 8) => Trùng thời gian (Overlap)
    expect(jsonArgs.errorRecords.length).toBe(1);
    expect(jsonArgs.errorRecords[0].errorReason).toContain("Trùng lịch với ca đang có");

    // Bản ghi 2 (13:00 - 15:00) => Valid vì (13 > 10) => Ko trùng
    expect(jsonArgs.validRecords.length).toBe(1);
    expect(jsonArgs.validRecords[0].startTime).toBe("13:00");
  });

  it("should return error if missing fields", async () => {
    const mockExcelData = [
      { doctorEmail: "", date: "2026-03-25", startTime: "09:00", endTime: "11:00" },
    ];
    xlsx.read.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } });
    xlsx.utils.sheet_to_json.mockReturnValue(mockExcelData);

    await previewExcel(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArgs = res.json.mock.calls[0][0];
    expect(jsonArgs.errorRecords[0].errorReason).toContain("Thiếu thông tin bắt buộc");
  });
});
