import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtpApi } from "../services/auth.api";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 Ưu tiên state → fallback localStorage
  const email =
    location.state?.email || localStorage.getItem("verify_email");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!email) {
      navigate("/register", { replace: true });
    }
  }, [email, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      setLoading(true);

      // 🔥 sanitize trước khi gửi
      await verifyOtpApi({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      // cleanup
      localStorage.removeItem("verify_email");

      navigate("/login", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow"
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          Verify OTP
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          We sent a 6-digit code to <b>{email}</b>
        </p>

        {err && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {err}
          </div>
        )}

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700">
            OTP Code
          </label>
          <input
            className="
              mt-2 w-full rounded-xl bg-white
              border border-gray-300 px-3 py-2
              text-gray-900 placeholder:text-gray-400
              tracking-widest text-center
              outline-none
              focus:border-gray-900 focus:ring-2 focus:ring-gray-200
            "
            placeholder="123456"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "")) // 🔥 chỉ cho số
            }
            maxLength={6}
            inputMode="numeric"
            required
          />
        </div>

        <button
          disabled={loading}
          className="
            mt-6 w-full rounded-xl bg-gray-900 py-2
            text-white font-medium
            hover:bg-gray-800
            disabled:opacity-50
          "
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}
