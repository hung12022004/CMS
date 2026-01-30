import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../services/auth.api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      setLoading(true);
      await registerApi({ name, email, password });
localStorage.setItem("verify_email", email);
      // 👉 chuyển sang verify OTP
      navigate("/verify-otp", {
  state: { email },
});
    } catch (e) {
      setErr(e?.response?.data?.message || "Register failed");
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
          Tạo tài khoản
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Đăng ký để tiếp tục
        </p>

        {err && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {err}
          </div>
        )}

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700">Tên</label>
          <input
            className="
              mt-2 w-full rounded-xl bg-white
              border border-gray-300 px-3 py-2
              text-gray-900 placeholder:text-gray-400
              outline-none
              focus:border-gray-900 focus:ring-2 focus:ring-gray-200
            "
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            className="
              mt-2 w-full rounded-xl bg-white
              border border-gray-300 px-3 py-2
              text-gray-900 placeholder:text-gray-400
              outline-none
              focus:border-gray-900 focus:ring-2 focus:ring-gray-200
            "
            placeholder="mitsu@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
          <input
            type="password"
            className="
              mt-2 w-full rounded-xl bg-white
              border border-gray-300 px-3 py-2
              text-gray-900 placeholder:text-gray-400
              outline-none
              focus:border-gray-900 focus:ring-2 focus:ring-gray-200
            "
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
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
          {loading ? "Đang tạo..." : "Đăng ký"}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-medium text-gray-900 hover:text-gray-700 underline"
            >
              Đăng nhập
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
