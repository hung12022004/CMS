
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerApi } from "../services/auth.api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    try {
      setLoading(true);
      const data = await registerApi({ name, email, password });

      // ✅ không lưu token
      setOkMsg(data?.message || "Register thành công. Hãy đăng nhập.");

      // ✅ chuyển về login sau khi đăng ký
      navigate("/login", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10">
      <div className="max-w-md rounded-2xl bg-white/5 border border-white/10 p-6">
        <h1 className="text-2xl font-bold">Register</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* inputs... */}
<div>
            <label className="text-sm text-slate-300">Name (optional)</label>
            <input
              className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-white/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mitsu"
            />
          </div>

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
              placeholder="tối thiểu 6 ký tự"
            />
          </div>
          {err ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          {okMsg ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {okMsg}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-2 font-semibold text-slate-900 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-white underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
