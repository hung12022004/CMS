import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { resetPasswordApi } from "../services/auth.api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const email = localStorage.getItem("reset_email");

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (password !== confirm) {
      setErr("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);

      await resetPasswordApi({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: password,
      });

      localStorage.removeItem("reset_email");
      navigate("/login", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Reset password failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
        <p className="mt-1 text-sm text-gray-600">
          Nhập mã OTP được gửi về <b>{email}</b>
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* OTP */}
          <div>
            <label className="text-sm font-medium text-gray-700">OTP</label>
            <input
              placeholder="123456"
              className="
                mt-2 w-full rounded-xl border border-gray-300 px-3 py-2
                tracking-widest
                focus:border-gray-900 focus:ring-2 focus:ring-gray-200
                text-gray-900 placeholder:text-gray-400
              "
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ""))
              }
              maxLength={6}
              required
            />
          </div>

          {/* New password */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Mật khẩu mới
            </label>
            <input
              type="password"
              className="
                mt-2 w-full rounded-xl border border-gray-300 px-3 py-2
                focus:border-gray-900 focus:ring-2 focus:ring-gray-200
                text-gray-900 placeholder:text-gray-400
              "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              className="
                mt-2 w-full rounded-xl border border-gray-300 px-3 py-2
                focus:border-gray-900 focus:ring-2 focus:ring-gray-200
                text-gray-900 placeholder:text-gray-400
              "
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-gray-900 px-4 py-2
                       font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Processing..." : "Reset password"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Quay lại{" "}
          <Link to="/login" className="text-gray-900 underline font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
