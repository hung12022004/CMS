const authorize = require("./authorize");
const User = require("../models/User");

jest.mock("../models/User");

describe("authorize middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: "user123" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should return 404 if user not found", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const middleware = authorize("Admin");
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("should return 403 if user role is not allowed", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ role: "Patient" }),
    });

    const middleware = authorize("Admin", "Doctor");
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Bạn không có quyền truy cập chức năng này" });
  });

  it("should call next if user role is allowed", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ role: "Admin" }),
    });

    const middleware = authorize("Admin");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe("Admin");
  });
});
