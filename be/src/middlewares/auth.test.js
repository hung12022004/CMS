const auth = require("./auth");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

describe("auth middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = "testsecret";
  });

  it("should return 401 if Authorization header is missing", () => {
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Missing/invalid Authorization header" });
  });

  it("should return 401 if token is invalid", () => {
    req.headers.authorization = "Bearer invalidtoken";
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
  });

  it("should call next() and set req.user if token is valid", () => {
    const payload = { id: "user123", email: "test@example.com" };
    req.headers.authorization = "Bearer validtoken";
    jwt.verify.mockReturnValue(payload);

    auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("validtoken", "testsecret");
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalled();
  });
});
