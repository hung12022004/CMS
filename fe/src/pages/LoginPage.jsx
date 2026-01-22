import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginApi } from "../services/auth.api";

export default function LoginPage() {
  const navigate = useNavigate();
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
      navigate("/");
    } catch (e) {
      setErr(e?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10">
      <div className="max-w-md rounded-2xl bg-white/5 border border-white/10 p-6">
        <h1 className="text-2xl font-bold">Sign in</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* inputs... */}
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-white/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mitsu@gmail.com"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-white/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>
          {err ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-2 font-semibold text-slate-900 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          Bạn chưa có tài khoản?{" "}
          <Link to="/register" className="text-white underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
