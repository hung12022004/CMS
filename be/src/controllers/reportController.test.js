const reportController = require("./reportController");
const Appointment = require("../models/Appointment");

jest.mock("../models/Appointment");

describe("reportController.getOverviewReport", () => {
  let req, res;

  beforeEach(() => {
    req = { query: { startDate: "2026-03-20", endDate: "2026-03-25" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  it("should return 400 if missing date ranges", async () => {
    req.query.endDate = null;
    await reportController.getOverviewReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should aggregate data correctly and return overview", async () => {
    const mockAggregationData = [
      {
        totalRevenue: 600000,
        totalPatients: 2,
        dailyRevenue: [
          { date: "2026-03-20", patients: 1, revenue: 300000 },
          { date: "2026-03-21", patients: 1, revenue: 300000 }
        ]
      }
    ];

    Appointment.aggregate.mockResolvedValue(mockAggregationData);

    await reportController.getOverviewReport(req, res);

    expect(Appointment.aggregate).toHaveBeenCalled();
    const pipeline = Appointment.aggregate.mock.calls[0][0]; // the first argument passed to aggregate
    expect(pipeline[0].$match).toHaveProperty("paymentStatus", "paid");
    expect(pipeline[0].$match.date).toHaveProperty("$gte", "2026-03-20");
    expect(pipeline[0].$match.date).toHaveProperty("$lte", "2026-03-25");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockAggregationData[0]);
  });

  it("should return empty structure if no data found", async () => {
    Appointment.aggregate.mockResolvedValue([]);

    await reportController.getOverviewReport(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      totalRevenue: 0,
      totalPatients: 0,
      dailyRevenue: []
    });
  });
});
