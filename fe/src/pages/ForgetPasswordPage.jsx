import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPasswordApi } from "../services/auth.api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    try {
      setLoading(true);
      await forgotPasswordApi({ email });

      // lưu email để dùng ở bước sau
      localStorage.setItem("reset_email", email.trim().toLowerCase());

      setSuccess("OTP đã được gửi về email");
      setTimeout(() => navigate("/reset-password"), 800);
    } catch (e) {
      setErr(e?.response?.data?.message || "Send OTP failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
        <p className="mt-1 text-sm text-gray-600">
          Nhập email để nhận mã OTP
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2
                         focus:border-gray-900 focus:ring-2 focus:ring-gray-200 text-gray-900 placeholder:text-gray-400"
              placeholder="mitsu@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-gray-900 px-4 py-2
                       font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send OTP"}
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
