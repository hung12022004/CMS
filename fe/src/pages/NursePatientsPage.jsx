import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import {
    getQueueEntriesApi,
    assignDoctorApi,
    updateQueueStatusApi,
} from "../services/checkin.api";
import { getDoctorsApi } from "../services/user.api";

const STATUS_CONFIG = {
    pending: { label: "Chờ phân loại", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "🕐" },
    waiting: { label: "Chờ khám", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "⏳" },
    in_progress: { label: "Đang khám", color: "bg-purple-100 text-purple-700 border-purple-200", icon: "🩺" },
    completed: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "✅" },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700 border-red-200", icon: "❌" },
};

function getWaitingTime(createdAt) {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa vào";
    if (mins < 60) return `${mins} phút`;
    return `${Math.floor(mins / 60)}h ${mins % 60}p`;
}

// ─── Assign Doctor Modal ───────────────────────────────────────────────────
function AssignDoctorModal({ entry, onClose, onAssigned }) {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [triageNotes, setTriageNotes] = useState("");
    const [roomNumber, setRoomNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        getDoctorsApi()
            .then((data) => setDoctors(data.doctors || []))
            .catch(console.error)
            .finally(() => setLoadingDoctors(false));
    }, []);

    const filtered = doctors.filter(
        (d) =>
            d.name.toLowerCase().includes(filter.toLowerCase()) ||
            d.specialty?.toLowerCase().includes(filter.toLowerCase())
    );

    const handleConfirm = async () => {
        if (!selectedDoctor) return;
        setLoading(true);
        try {
            const data = await assignDoctorApi(entry._id, selectedDoctor._id, triageNotes, roomNumber);
            onAssigned(data.entry);
        } catch (err) {
            console.error("assignDoctor error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
                    <h3 className="font-bold text-lg">Phân loại & Gán bác sĩ</h3>
                    <p className="text-blue-100 text-sm mt-0.5">
                        Bệnh nhân: <span className="font-semibold">{entry.patientName}</span>
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Symptoms */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-600 mb-1">🤒 Triệu chứng</p>
                        <p className="text-sm text-gray-700">{entry.symptoms}</p>
                    </div>

                    {/* Triage Notes */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Ghi chú phân loại (tuỳ chọn)</label>
                        <textarea
                            rows={2}
                            value={triageNotes}
                            onChange={(e) => setTriageNotes(e.target.value)}
                            placeholder="VD: Dự kiến cần xét nghiệm máu..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-400 resize-none"
                        />
                    </div>

                    {/* Room Number */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">🚪 Số phòng khám (tuỳ chọn)</label>
                        <input
                            type="text"
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            placeholder="VD: P101, P2, Phòng Xét nghiệm..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-teal-400"
                        />
                    </div>

                    {/* Doctor List */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Chọn bác sĩ</label>
                        <input
                            type="text"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="Tìm tên hoặc chuyên khoa..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-400 mb-2"
                        />
                        <div className="space-y-2 max-h-52 overflow-y-auto">
                            {loadingDoctors ? (
                                <p className="text-center text-gray-400 py-4 text-sm">Đang tải...</p>
                            ) : filtered.length === 0 ? (
                                <p className="text-center text-gray-400 py-4 text-sm">Không tìm thấy bác sĩ</p>
                            ) : (
                                filtered.map((doc) => (
                                    <button
                                        key={doc._id}
                                        onClick={() => setSelectedDoctor(doc)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition border ${selectedDoctor?._id === doc._id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-100 hover:border-blue-300 hover:bg-blue-50/50"
                                            }`}
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {doc.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{doc.specialty || "Đa khoa"}</p>
                                        </div>
                                        {selectedDoctor?._id === doc._id && (
                                            <span className="text-blue-600 text-lg flex-shrink-0">✓</span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
                    >
                        Huỷ
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedDoctor || loading}
                        className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Đang xử lý..." : "✓ Xác nhận gán bác sĩ"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function NursePatientsPage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending");
    const [search, setSearch] = useState("");
    const [assignModalEntry, setAssignModalEntry] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchEntries = useCallback(async () => {
        try {
            const data = await getQueueEntriesApi();
            setEntries(data.entries || []);
        } catch (err) {
            console.error("fetchEntries error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEntries();
        const interval = setInterval(fetchEntries, 30000);
        return () => clearInterval(interval);
    }, [fetchEntries]);

    const handleStatusChange = async (id, status) => {
        setUpdatingId(id);
        try {
            await updateQueueStatusApi(id, status);
            await fetchEntries();
        } catch (err) {
            console.error("updateStatus error:", err);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleAssigned = (updatedEntry) => {
        setEntries((prev) =>
            prev.map((e) => (e._id === updatedEntry._id ? updatedEntry : e))
        );
        setAssignModalEntry(null);
        setActiveTab("waiting");
    };

    // Count by status
    const counts = entries.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
    }, {});

    const tabs = [
        { key: "pending", label: "Chờ phân loại", badge: "bg-amber-500" },
        { key: "waiting", label: "Đã phân loại", badge: "bg-blue-500" },
        { key: "in_progress", label: "Đang khám", badge: "bg-purple-500" },
        { key: "completed", label: "Hoàn thành", badge: "bg-emerald-500" },
    ];

    const filtered = entries.filter((e) => {
        const matchStatus = e.status === activeTab;
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            e.patientName.toLowerCase().includes(q) ||
            e.patientPhone?.includes(q) ||
            e.symptoms.toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-2xl shadow-lg">
                            👩‍⚕️
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Bảng điều phối</h1>
                            <p className="text-gray-500 text-sm">
                                Xin chào, <span className="font-semibold text-teal-600">{user?.name}</span> • Hôm nay {new Date().toLocaleDateString("vi-VN")}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchEntries}
                            className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition shadow-sm"
                        >
                            🔄 Làm mới
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Chờ phân loại", key: "pending", from: "from-amber-400", to: "to-orange-500", icon: "🕐" },
                        { label: "Đã phân loại", key: "waiting", from: "from-blue-400", to: "to-indigo-500", icon: "⏳" },
                        { label: "Đang khám", key: "in_progress", from: "from-purple-500", to: "to-violet-600", icon: "🩺" },
                        { label: "Hoàn thành", key: "completed", from: "from-emerald-400", to: "to-teal-500", icon: "✅" },
                    ].map((s) => (
                        <button
                            key={s.key}
                            onClick={() => setActiveTab(s.key)}
                            className={`bg-gradient-to-br ${s.from} ${s.to} rounded-2xl p-4 text-white shadow-md hover:shadow-lg transition-all text-left ${activeTab === s.key ? "ring-2 ring-offset-2 ring-offset-slate-50 ring-white" : ""}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium opacity-90">{s.label}</span>
                                <span className="text-xl">{s.icon}</span>
                            </div>
                            <p className="text-4xl font-black">{counts[s.key] || 0}</p>
                        </button>
                    ))}
                </div>

                {/* Tabs + Search */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex gap-2">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${activeTab === t.key
                                    ? "bg-white shadow-md text-gray-800 border border-gray-200"
                                    : "text-gray-500 hover:bg-white/60"
                                    }`}
                            >
                                {t.label}
                                {(counts[t.key] || 0) > 0 && (
                                    <span className={`${t.badge} text-white text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                                        {counts[t.key]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm tên, SĐT, triệu chứng..."
                        className="ml-auto px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition w-64"
                    />
                </div>

                {/* Entry List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin w-8 h-8 text-indigo-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                        <div className="text-5xl mb-3">
                            {activeTab === "pending" ? "🎉" : "📋"}
                        </div>
                        <p className="text-gray-500 font-medium">
                            {activeTab === "pending"
                                ? "Không có bệnh nhân nào đang chờ phân loại"
                                : "Không có dữ liệu"}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filtered.map((entry) => {
                            const sc = STATUS_CONFIG[entry.status];
                            const isUpdating = updatingId === entry._id;
                            return (
                                <div
                                    key={entry._id}
                                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all ${entry.status === "pending" ? "border-l-4 border-l-amber-400" : entry.status === "waiting" ? "border-l-4 border-l-blue-500" : ""}`}
                                >
                                    <div className="flex flex-wrap items-start gap-4">
                                        {/* Queue Number */}
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg">
                                            #{String(entry.queueNumber).padStart(2, "0")}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-800">{entry.patientName}</h3>
                                                {entry.patientPhone && (
                                                    <span className="text-xs text-gray-400">📞 {entry.patientPhone}</span>
                                                )}
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${sc.color}`}>
                                                    {sc.icon} {sc.label}
                                                </span>
                                            </div>
                                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-2">
                                                <p className="text-xs text-amber-600 font-semibold mb-0.5">🤒 Triệu chứng</p>
                                                <p className="text-sm text-gray-700">{entry.symptoms}</p>
                                            </div>
                                            {entry.doctorId && (
                                                <p className="text-xs text-indigo-600 font-medium">
                                                    👨‍⚕️ Bác sĩ: <span className="font-bold">{entry.doctorId.name}</span>
                                                    {entry.doctorId.specialty && <span className="text-gray-400"> ({entry.doctorId.specialty})</span>}
                                                </p>
                                            )}
                                            {entry.roomNumber && (
                                                <p className="text-xs text-teal-600 font-semibold mt-0.5">
                                                    🚪 Phòng khám: <span className="font-bold">{entry.roomNumber}</span>
                                                </p>
                                            )}
                                            {entry.triageNotes && (
                                                <p className="text-xs text-gray-400 italic mt-1">📝 {entry.triageNotes}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                ⏱ {getWaitingTime(entry.createdAt)}
                                                <span className="mx-1">•</span>
                                                {new Date(entry.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex-shrink-0 flex gap-2">
                                            {entry.status === "pending" && (
                                                <button
                                                    onClick={() => setAssignModalEntry(entry)}
                                                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 transition shadow-md hover:shadow-lg"
                                                >
                                                    👨‍⚕️ Gán bác sĩ
                                                </button>
                                            )}
                                            {(entry.status === "pending" || entry.status === "waiting") && (
                                                <button
                                                    onClick={() => handleStatusChange(entry._id, "cancelled")}
                                                    disabled={isUpdating}
                                                    className="px-3 py-2.5 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition font-medium disabled:opacity-50"
                                                >
                                                    Huỷ
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-6">
                    🔄 Danh sách tự động cập nhật mỗi 30 giây
                </p>
            </div>

            {/* Assign Doctor Modal */}
            {assignModalEntry && (
                <AssignDoctorModal
                    entry={assignModalEntry}
                    onClose={() => setAssignModalEntry(null)}
                    onAssigned={handleAssigned}
                />
            )}
        </div>
    );
}
