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

      // không lưu token
      setOkMsg(data?.message || "Register thành công. Hãy đăng nhập.");

      // chuyển về login sau khi đăng ký
      navigate("/login", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Register</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tạo tài khoản mới
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Name (optional)
            </label>
            <input
              className="
                mt-2 w-full rounded-xl bg-white
                border border-gray-300 px-3 py-2
                text-gray-900 placeholder:text-gray-400
                outline-none
                focus:border-gray-900 focus:ring-2 focus:ring-gray-200
              "
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mitsu"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              className="
                mt-2 w-full rounded-xl bg-white
                border border-gray-300 px-3 py-2
                text-gray-900 placeholder:text-gray-400
                outline-none
                focus:border-gray-900 focus:ring-2 focus:ring-gray-200
              "
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
              className="
                mt-2 w-full rounded-xl bg-white
                border border-gray-300 px-3 py-2
                text-gray-900 placeholder:text-gray-400
                outline-none
                focus:border-gray-900 focus:ring-2 focus:ring-gray-200
              "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="tối thiểu 6 ký tự"
              autoComplete="new-password"
            />
          </div>

          {err ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          {okMsg ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {okMsg}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="
              w-full rounded-xl bg-gray-900 px-4 py-2
              font-semibold text-white
              hover:opacity-90 disabled:opacity-60
              transition
            "
          >
            {loading ? "Loading..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-gray-900 underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
