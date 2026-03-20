import { useState, useEffect } from "react";
import { getAllUsersApi, updateUserRoleApi, createStaffAccountApi, toggleBanUserApi } from "../services/admin.api";

const ROLE_LABELS = {
    admin: { label: "Admin", color: "bg-red-500/20 text-red-400" },
    doctor: { label: "Bác sĩ", color: "bg-blue-500/20 text-blue-400" },
    nurse: { label: "Y tá", color: "bg-green-500/20 text-green-400" },
    patient: { label: "Bệnh nhân", color: "bg-slate-500/20 text-slate-400" },
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({});
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [banning, setBanning] = useState(null);

    // Create staff modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "doctor",
        gender: "unknown",
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState("");
    const [createSuccess, setCreateSuccess] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsersApi({ page, limit: 15, search });
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (err) {
            console.error("Fetch users error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const handleRoleChange = async (userId, newRole) => {
        setUpdating(userId);
        try {
            await updateUserRoleApi(userId, newRole);
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
            );
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi đổi role");
        } finally {
            setUpdating(null);
        }
    };

    const handleToggleBan = async (userId) => {
        setBanning(userId);
        try {
            const data = await toggleBanUserApi(userId);
            setUsers((prev) =>
                prev.map((u) =>
                    u._id === userId ? { ...u, isBanned: data.user.isBanned } : u
                )
            );
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi ban/unban");
        } finally {
            setBanning(null);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateError("");
        setCreateSuccess("");
        try {
            const data = await createStaffAccountApi(createForm);
            setCreateSuccess(data.message);
            setCreateForm({ name: "", email: "", password: "", role: "doctor", gender: "unknown" });
            fetchUsers(); // Reload list
            setTimeout(() => {
                setShowCreateModal(false);
                setCreateSuccess("");
            }, 1500);
        } catch (err) {
            setCreateError(err.response?.data?.message || "Lỗi khi tạo tài khoản");
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Quản lý người dùng
                        </h1>
                        <p className="text-slate-400">
                            Xem và phân quyền tài khoản cho bác sĩ, y tá, bệnh nhân
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Tạo tài khoản
                    </button>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="mb-6 flex gap-3">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm theo tên hoặc email..."
                        className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Tìm kiếm
                    </button>
                </form>

                {/* Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                        Người dùng
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-slate-500"
                                        >
                                            Không tìm thấy người dùng nào
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr
                                            key={u._id}
                                            className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${u.isBanned ? "opacity-60" : ""}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                        {(u.name || u.email)[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="text-white font-medium">
                                                            {u.name || "—"}
                                                        </span>
                                                        {u.isBanned && (
                                                            <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full">
                                                                BỊ KHÓA
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {u.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_LABELS[u.role]?.color || "bg-slate-700 text-slate-300"
                                                        }`}
                                                >
                                                    {ROLE_LABELS[u.role]?.label || u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${u.isBanned
                                                        ? "bg-red-500/20 text-red-400"
                                                        : u.isVerified
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : "bg-amber-500/20 text-amber-400"
                                                        }`}
                                                >
                                                    {u.isBanned ? "Bị khóa" : u.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={u.role}
                                                        disabled={updating === u._id}
                                                        onChange={(e) =>
                                                            handleRoleChange(u._id, e.target.value)
                                                        }
                                                        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
                                                    >
                                                        <option value="patient">Bệnh nhân</option>
                                                        <option value="doctor">Bác sĩ</option>
                                                        <option value="nurse">Y tá</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleToggleBan(u._id)}
                                                        disabled={banning === u._id || u.role === "admin"}
                                                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${u.isBanned
                                                                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                                                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                                            }`}
                                                        title={u.isBanned ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                                    >
                                                        {banning === u._id ? "..." : u.isBanned ? "Unban" : "Ban"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
                            <p className="text-sm text-slate-400">
                                Trang {pagination.page} / {pagination.totalPages} — Tổng{" "}
                                {pagination.total} người dùng
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm disabled:opacity-40 transition-colors"
                                >
                                    ← Trước
                                </button>
                                <button
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm disabled:opacity-40 transition-colors"
                                >
                                    Tiếp →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Staff Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                Tạo tài khoản nhân viên
                            </h2>
                            <button
                                onClick={() => { setShowCreateModal(false); setCreateError(""); setCreateSuccess(""); }}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateStaff} className="space-y-4">
                            {/* Role */}
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block">Vai trò</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setCreateForm(f => ({ ...f, role: "doctor" }))}
                                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${createForm.role === "doctor"
                                                ? "bg-blue-600 text-white shadow-lg"
                                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                            }`}
                                    >
                                        🩺 Bác sĩ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCreateForm(f => ({ ...f, role: "nurse" }))}
                                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${createForm.role === "nurse"
                                                ? "bg-green-600 text-white shadow-lg"
                                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                            }`}
                                    >
                                        💉 Y tá
                                    </button>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block">Họ tên</label>
                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="BS. Nguyễn Văn X"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="doctor@clinic.com"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block">Mật khẩu *</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="Tối thiểu 6 ký tự"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block">Giới tính</label>
                                <select
                                    value={createForm.gender}
                                    onChange={(e) => setCreateForm(f => ({ ...f, gender: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                    <option value="unknown">Không rõ</option>
                                </select>
                            </div>

                            {/* Messages */}
                            {createError && (
                                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    {createError}
                                </div>
                            )}
                            {createSuccess && (
                                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
                                    ✅ {createSuccess}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={createLoading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60"
                            >
                                {createLoading ? "Đang tạo..." : "Tạo tài khoản"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
