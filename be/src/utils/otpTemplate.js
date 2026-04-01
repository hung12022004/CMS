function buildOtpTemplate({ otp, type }) {
  const title =
    type === "REGISTER"
      ? "Xác thực đăng ký tài khoản"
      : "Đặt lại mật khẩu";

  const description =
    type === "REGISTER"
      ? "Sử dụng mã OTP bên dưới để hoàn tất đăng ký."
      : "Sử dụng mã OTP bên dưới để đặt lại mật khẩu.";

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="480" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:10px;padding:30px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="text-align:center;">
              <h2 style="margin:0;color:#111;">${title}</h2>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 0;color:#555;text-align:center;">
              ${description}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 0;">
              <div style="
                font-size:32px;
                font-weight:bold;
                letter-spacing:6px;
                color:#2563eb;
                background:#eef2ff;
                padding:14px 24px;
                border-radius:8px;
                display:inline-block;">
                ${otp}
              </div>
            </td>
          </tr>

          <tr>
            <td style="color:#666;font-size:14px;text-align:center;">
              Mã có hiệu lực trong <b>5 phút</b>.<br/>
              Nếu bạn không yêu cầu, hãy bỏ qua email này.
            </td>
          </tr>

          <tr>
            <td style="padding-top:24px;font-size:12px;color:#999;text-align:center;">
              © ${new Date().getFullYear()} Clinic CMS
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function buildMedicalRecordTemplate({ patientName, doctorName, date, diagnosis }) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Thông báo hoàn thành hồ sơ bệnh án</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
          
          <tr>
            <td style="text-align:center; padding-bottom: 24px;">
              <div style="width: 60px; height: 60px; background: #eff6ff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 30px;">📋</span>
              </div>
              <h2 style="margin:0;color:#1e293b; font-size: 20px;">Thông báo hoàn thành hồ sơ</h2>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 0; color:#475569; font-size: 15px; line-height: 1.6;">
              Chào bạn <strong>${patientName}</strong>,
              <br/><br/>
              Phòng khám xin thông báo hồ sơ bệnh án của bạn cho buổi khám ngày <strong>${date}</strong> đã được bác sĩ <strong>${doctorName}</strong> hoàn tất.
            </td>
          </tr>

          <tr>
            <td style="padding:20px; background:#f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
              <p style="margin:0 0 8px 0; font-size: 12px; text-transform: uppercase; font-weight: bold; color: #64748b; letter-spacing: 0.05em;">Kết luận chẩn đoán</p>
              <p style="margin:0; font-size: 16px; color: #1e293b; font-weight: 600;">${diagnosis}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 0; text-align:center;">
              <p style="margin:0 0 16px 0; color:#64748b; font-size: 14px;">Bạn có thể đăng nhập vào hệ thống để xem chi tiết đơn thuốc và hướng dẫn điều trị.</p>
              <a href="${process.env.CLIENT_URL || '#'}/medical-records" style="
                background:#2563eb;
                color:#ffffff;
                padding:12px 24px;
                border-radius:8px;
                text-decoration:none;
                font-weight:bold;
                font-size: 14px;
                display:inline-block;">
                Xem hồ sơ bệnh án
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding-top:24px; border-top: 1px solid #f1f5f9; font-size:12px; color:#94a3b8; text-align:center;">
              Đây là email tự động, vui lòng không trả lời.<br/>
              © ${new Date().getFullYear()} Clinic CMS
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

module.exports = { buildOtpTemplate, buildMedicalRecordTemplate };
