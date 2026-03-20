const { createOtp } = require("./otp-provider");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");

jest.mock("../models/Otp");
jest.mock("bcryptjs");

describe("otp-provider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createOtp", () => {
    it("should delete existing OTPs and create a new one", async () => {
      const email = "test@example.com";
      const type = "REGISTER";
      const otpCode = "123456";
      const salt = "salt";
      const hash = "hash";

      // Mock random for generateOtp
      jest.spyOn(Math, "random").mockReturnValue(0.123456); 
      // Math.floor(100000 + 0.123456 * 900000) = 211110 (approximately)
      // Let's just mock general behavior
      
      bcrypt.genSalt.mockResolvedValue(salt);
      bcrypt.hash.mockResolvedValue(hash);
      Otp.deleteMany.mockResolvedValue({});
      Otp.create.mockResolvedValue({});

      const result = await createOtp({ email, type });

      expect(Otp.deleteMany).toHaveBeenCalledWith({ email, type });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(Otp.create).toHaveBeenCalledWith(expect.objectContaining({
        email,
        codeHash: hash,
        type,
        expiresAt: expect.any(Date)
      }));
      expect(result).toHaveLength(6);
      
      jest.spyOn(Math, "random").mockRestore();
    });
  });
});
