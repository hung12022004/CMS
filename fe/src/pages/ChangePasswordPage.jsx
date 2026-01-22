import { useState } from "react";
import { changePasswordApi } from "../services/user.api";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    if (newPassword.length < 6) {
      setErr("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErr("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);

      await changePasswordApi({
        currentPassword,
        newPassword,
      });

      setOkMsg("Đổi mật khẩu thành công ✅");

      // reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setErr(e?.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `
    mt-2 w-full rounded-xl bg-white
    border border-gray-300 px-3 py-2
    text-gray-900 focus:text-gray-900
    placeholder:text-gray-400
    outline-none
    focus:border-gray-900
    focus:ring-2 focus:ring-gray-200
    autofill:text-gray-900
  `;

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Change password
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Cập nhật mật khẩu mới cho tài khoản
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* Current password */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              className={inputClass}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              autoComplete="current-password"
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
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password"
              required
            />
          </div>

          {/* Confirm password */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              required
            />
          </div>

          {/* Error */}
          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          )}

          {/* Success */}
          {okMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {okMsg}
            </div>
          )}

          <button
            disabled={loading}
            className="
              w-full rounded-xl bg-gray-900 px-4 py-2
              font-semibold text-white
              hover:opacity-90 disabled:opacity-60
              transition
            "
          >
            {loading ? "Processing..." : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}
