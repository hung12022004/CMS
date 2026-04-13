// Mock for mongoose testing
const mongoose = require("mongoose");
const { toggleBanUser } = require("./userController");
const User = require("../models/User");
const AccountActionLog = require("../models/AccountActionLog");

jest.mock("../models/User");
jest.mock("../models/AccountActionLog");

describe("userController.toggleBanUser", () => {
  let req, res, sessionMock, targetUserMock;

  beforeEach(() => {
    req = {
      params: { id: "user123" },
      body: { action: "BAN", reason: "Spam behavior" },
      user: { id: "admin456" }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    sessionMock = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    jest.spyOn(mongoose, "startSession").mockResolvedValue(sessionMock);

    targetUserMock = {
      _id: "user123",
      accountStatus: "ACTIVE",
      role: "patient",
      save: jest.fn().mockResolvedValue(true)
    };

    const findByIdMock = {
      session: jest.fn().mockResolvedValue(targetUserMock)
    };
    User.findById.mockReturnValue(findByIdMock);

    AccountActionLog.prototype.save = jest.fn().mockResolvedValue(true);
    jest.clearAllMocks();
  });

  it("should return 400 if reason is missing", async () => {
    req.body.reason = "";
    await toggleBanUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(sessionMock.abortTransaction).not.toHaveBeenCalled(); // Trả về sớm, session abort được gọi nếu throw, wait - hàm đang viết throw khi lỗi nhưng reject khi validation thì ko abort? Wait! Trong code t tạo try-catch, có gọi `session.abortTransaction()` nếu catch err, nhưng validation reason diễn ra trước phần `findById`
  });

  it("should execute transaction correctly when banning a user", async () => {
    await toggleBanUser(req, res);

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(sessionMock.startTransaction).toHaveBeenCalled();
    expect(targetUserMock.accountStatus).toBe("BANNED");
    expect(targetUserMock.save).toHaveBeenCalledWith({ session: sessionMock });
    expect(AccountActionLog.prototype.save).toHaveBeenCalledWith({ session: sessionMock });
    expect(sessionMock.commitTransaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Khóa tài khoản thành công" }));
  });

  it("should abort transaction if saving log fails", async () => {
    AccountActionLog.prototype.save.mockRejectedValue(new Error("DB Error"));

    await toggleBanUser(req, res);

    expect(sessionMock.abortTransaction).toHaveBeenCalled();
    expect(sessionMock.endSession).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
