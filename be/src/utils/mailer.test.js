// Mocking must come before requiring the module that uses it
const mockSendMail = jest.fn().mockResolvedValue({ messageId: "123" });
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: mockSendMail,
  }),
}));

const { sendOtpEmail } = require("./mailer");

describe("mailer utility", () => {
  beforeEach(() => {
    mockSendMail.mockClear();
  });

  test("should send REGISTER email with correct subject and OTP", async () => {
    const to = "test@example.com";
    const otp = "123456";
    const type = "REGISTER";

    await sendOtpEmail({ to, otp, type });

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to,
      subject: "Xác thực đăng ký tài khoản",
      html: expect.stringContaining(otp),
    }));
  });

  test("should send RESET email with correct subject and OTP", async () => {
    const to = "test@example.com";
    const otp = "654321";
    const type = "RESET";

    await sendOtpEmail({ to, otp, type });

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to,
      subject: "Đặt lại mật khẩu",
      html: expect.stringContaining(otp),
    }));
  });
});
