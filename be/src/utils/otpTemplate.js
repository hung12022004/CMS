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

module.exports = { buildOtpTemplate };
