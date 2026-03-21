import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtpApi, resendOtpApi } from "../services/auth.api";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 Ưu tiên state → fallback localStorage
  const email =
    location.state?.email || localStorage.getItem("verify_email");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // ✅ Timer countdown 5 phút
  const [remainingTime, setRemainingTime] = useState(5 * 60); // 5 phút = 300 giây
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  // ✅ Attempts tracking
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  useEffect(() => {
    if (!email) {
      navigate("/register", { replace: true });
    }
  }, [email, navigate]);

  // ✅ Timer countdown effect
  useEffect(() => {
    if (remainingTime <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (otp.length !== 6) {
      setErr("Vui lòng nhập đủ 6 ký tự OTP");
      return;
    }

    try {
      setLoading(true);

      // 🔥 sanitize trước khi gửi
      await verifyOtpApi({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      // ✅ Xác thực thành công - show modal
      setSuccess(true);

      // cleanup
      localStorage.removeItem("verify_email");
    } catch (e) {
      const errMsg = e?.response?.data?.message || "Invalid OTP";
      setErr(errMsg);

      // ✅ Cập nhật attempts left từ error message
      if (errMsg.includes("còn")) {
        const match = errMsg.match(/(\d+)\s+lần/);
        if (match) {
          setAttemptsLeft(parseInt(match[1]));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setErr("");
    setResending(true);

    try {
      await resendOtpApi({ email: email.trim().toLowerCase() });

      // ✅ Reset timer
      setRemainingTime(5 * 60);
      setCanResend(false);
      setOtp("");
      setAttemptsLeft(5);
      setResendSuccess(true);

      // Auto close after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (e) {
      const msg = e?.response?.data?.message || "Gửi lại OTP thất bại";
      setErr(msg);
    } finally {
      setResending(false);
    }
  };

  const handleLoginAgain = () => {
    navigate("/login", { replace: true });
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
          {/* ✅ Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Xác thực thành công!
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Tài khoản của bạn đã được tạo thành công. Hãy đăng nhập để bắt đầu sử dụng.
          </p>

          <button
            onClick={handleLoginAgain}
            className="
              w-full rounded-xl bg-blue-600 py-3
              text-white font-medium
              hover:bg-blue-700 transition
            "
          >
            Đăng Nhập Ngay
          </button>
        </div>
      </div>
    );
  }

  if (resendSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-bounce">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-blue-900 mb-2">
            OTP đã được gửi!
          </h2>
          <p className="text-center text-gray-600">
            Mã xác thực mới đã gửi tới email <b>{email}</b>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow"
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          Xác Nhận OTP
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Chúng tôi đã gửi mã xác thực 6 ký tự tới <b>{email}</b>
        </p>

        {err && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {err}
          </div>
        )}

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Mã OTP
            </label>
            <span className="text-xs font-medium text-amber-600">
              ⏱ {formatTime(remainingTime)}
            </span>
          </div>
          <input
            className="
              mt-2 w-full rounded-xl bg-white
              border border-gray-300 px-3 py-2
              text-gray-900 placeholder:text-gray-400
              tracking-widest text-center text-2xl
              outline-none
              focus:border-gray-900 focus:ring-2 focus:ring-gray-200
            "
            placeholder="000000"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            maxLength={6}
            inputMode="numeric"
            required
          />
          <p className="mt-2 text-xs text-gray-500">
            Còn {attemptsLeft} lần thử (tối đa 5 lần)
          </p>
        </div>

        {/* ✅ Nút Verify */}
        <button
          disabled={loading || otp.length !== 6}
          className="
            mt-6 w-full rounded-xl bg-gray-900 py-2
            text-white font-medium
            hover:bg-gray-800 disabled:opacity-50
            transition duration-200
          "
        >
          {loading ? "Đang xác nhận..." : "Xác Nhận"}
        </button>

        {/* ✅ Nút Resend OTP */}
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || resending}
          className="
            mt-3 w-full rounded-xl border-2 border-gray-300 py-2
            text-gray-700 font-medium
            hover:border-gray-400 hover:bg-gray-50
            disabled:opacity-50 disabled:cursor-not-allowed
            transition duration-200
          "
        >
          {resending ? "Đang gửi lại..." : "Gửi Lại OTP"}
        </button>

        {!canResend && (
          <p className="mt-2 text-center text-xs text-gray-500">
            Chờ {formatTime(remainingTime)} để gửi lại OTP
          </p>
        )}
      </form>
    </div>
  );
}
