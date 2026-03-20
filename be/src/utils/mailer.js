const nodemailer = require("nodemailer");
const { buildOtpTemplate } = require("./otpTemplate");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER, // email gửi
    pass: process.env.MAIL_PASS, // app password
  },
});

async function sendOtpEmail({ to, otp, type }) {
  const subject =
    type === "REGISTER"
      ? "Xác thực đăng ký tài khoản"
      : "Đặt lại mật khẩu";

  const html = buildOtpTemplate({ otp, type });

  await transporter.sendMail({
    from: `"Clinic CMS" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendOtpEmail };
