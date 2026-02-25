import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginApi, googleLoginApi } from "../services/auth.api";
import { useAuth } from "../hooks/useAuth";

// Chuyển hướng theo role sau login
function getRedirectByRole(role) {
  switch (role) {
    case "admin": return "/dashboard";
    case "doctor": return "/appointments";
    case "nurse": return "/dashboard";
    default: return "/";
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      setLoading(true);

      const data = await loginApi({ email, password });

      localStorage.setItem("accessToken", data.accessToken);
      login(data.user);
      navigate(getRedirectByRole(data.user.role), { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setErr("");

      const data = await googleLoginApi(credentialResponse.credential);

      localStorage.setItem("accessToken", data.accessToken);
      login(data.user);
      navigate(getRedirectByRole(data.user.role), { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErr("Google login failed. Please try again.");
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
        <p className="mt-1 text-sm text-gray-600">
          Đăng nhập để tiếp tục
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2
                         focus:border-gray-900 focus:ring-2 focus:ring-gray-200  text-gray-900 placeholder:text-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mitsu@gmail.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2
                         focus:border-gray-900 focus:ring-2 focus:ring-gray-200  text-gray-900 placeholder:text-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
            />
          </div>

          {/* 🔑 Quên mật khẩu */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-gray-900 underline"
            >
              Quên mật khẩu?
            </Link>
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
            {loading ? "Loading..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-sm text-gray-500">hoặc</span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>

        {/* Google Login Button */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            text="signin_with"
            shape="pill"
            width="100%"
          />
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Bạn chưa có tài khoản?{" "}
          <Link to="/register" className="text-gray-900 underline font-medium">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
