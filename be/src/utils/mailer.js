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

async function sendAppointmentConfirmationEmail({ to, patientName, date, time, type }) {
  const subject = "Xác nhận lịch hẹn khám bệnh";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2c3e50; text-align: center;">Xác Nhận Lịch Hẹn</h2>
      <p>Xin chào <strong>${patientName}</strong>,</p>
      <p>Lịch hẹn khám bệnh của bạn đã được bác sĩ xác nhận. Dưới đây là thông tin chi tiết:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Ngày khám:</strong> ${date}</p>
        <p><strong>Thời gian:</strong> ${time}</p>
        <p><strong>Hình thức:</strong> ${type === "online" ? "Khám trực tuyến" : "Khám tại phòng khám"}</p>
      </div>
      <p>Vui lòng có mặt đúng giờ để được phục vụ tốt nhất.</p>
      <p>Trân trọng,<br><strong>Clinic CMS Team</strong></p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Clinic CMS" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendOtpEmail, sendAppointmentConfirmationEmail };
