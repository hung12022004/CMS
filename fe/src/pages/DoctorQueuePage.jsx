import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getQueueEntriesApi, updateQueueStatusApi } from "../services/checkin.api";

// ─── Helpers ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    waiting:     { label: "Chờ khám",   color: "bg-amber-100 text-amber-700 border-amber-200",   icon: "⏳" },
    in_progress: { label: "Đang khám",  color: "bg-purple-100 text-purple-700 border-purple-200", icon: "🩺" },
    completed:   { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "✅" },
    cancelled:   { label: "Đã hủy",     color: "bg-red-100 text-red-700 border-red-200",          icon: "❌" },
};

function getWaitingTime(createdAt) {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa vào";
    if (mins < 60) return `${mins} phút`;
    return `${Math.floor(mins / 60)}h ${mins % 60}p`;
}

// ─── Queue Card ─────────────────────────────────────────────────────────────
function QueueCard({ entry, onStatusChange, isUpdating, navigate }) {
    const sc = STATUS_CONFIG[entry.status] || STATUS_CONFIG.waiting;
    const isActive = entry.status === "waiting" || entry.status === "in_progress";

    return (
        <div className={`bg-white rounded-2xl shadow-sm border-l-4 p-5 hover:shadow-md transition-all ${
            entry.status === "in_progress" ? "border-l-purple-500" : 
            entry.status === "waiting" ? "border-l-amber-400" : "border-l-gray-200"
        }`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Queue # badge */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-lg select-none">
                        #{String(entry.queueNumber).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-800">{entry.patientName}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${sc.color}`}>
                                {sc.icon} {sc.label}
                            </span>
                        </div>
                        {entry.patientPhone && (
                            <p className="text-xs text-gray-400 mb-2">📞 {entry.patientPhone}</p>
                        )}
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-2">
                            <p className="text-xs text-amber-600 font-semibold mb-0.5">🤒 Triệu chứng</p>
                            <p className="text-sm text-gray-700">{entry.symptoms}</p>
                        </div>
                        {entry.triageNotes && (
                            <p className="text-xs text-gray-400 italic">📋 {entry.triageNotes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                            ⏱ {getWaitingTime(entry.createdAt)}
                            <span className="mx-1">•</span>
                            {new Date(entry.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                {isActive && (
                    <div className="flex-shrink-0 flex flex-col gap-2">
                        {entry.status === "waiting" && (
                            <button
                                onClick={() => onStatusChange(entry._id, "in_progress")}
                                disabled={isUpdating}
                                className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-700 transition shadow-md disabled:opacity-60"
                            >
                                🩺 Bắt đầu khám
                            </button>
                        )}
                        {entry.status === "in_progress" && (
                            <button
                                onClick={() => navigate("/medical-records", {
                                    state: { patientName: entry.patientName, patientPhone: entry.patientPhone, queueEntryId: entry._id, appointmentId: entry.appointmentId }
                                })}
                                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition shadow-md"
                            >
                                📝 Tạo hồ sơ
                            </button>
                        )}
                        <button
                            onClick={() => onStatusChange(entry._id, "cancelled")}
                            disabled={isUpdating}
                            className="px-3 py-2 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition font-medium"
                        >
                            Hủy
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DoctorQueuePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [activeTab, setActiveTab] = useState("active"); // "active" | "done"

    const fetchQueue = useCallback(async () => {
        try {
            const res = await getQueueEntriesApi();
            setEntries(res.entries || []);
        } catch (err) {
            console.error("fetchQueue error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 30000);
        return () => clearInterval(interval);
    }, [fetchQueue]);

    const active = entries
        .filter(e => e.status === "waiting" || e.status === "in_progress")
        .sort((a, b) => {
            if (a.status === "in_progress" && b.status !== "in_progress") return -1;
            if (b.status === "in_progress" && a.status !== "in_progress") return 1;
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

    const done = entries.filter(e => e.status === "completed" || e.status === "cancelled");

    const list = activeTab === "active" ? active : done;

    const handleStatusChange = async (id, status) => {
        setUpdatingId(id);
        try {
            await updateQueueStatusApi(id, status);
            await fetchQueue();
        } catch (err) {
            console.error("updateStatus error:", err);
        } finally {
            setUpdatingId(null);
        }
    };

    const waiting = entries.filter(e => e.status === "waiting").length;
    const inProgress = entries.filter(e => e.status === "in_progress").length;
    const completed = entries.filter(e => e.status === "completed").length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 pt-20 pb-8">
            <div className="max-w-3xl mx-auto px-4">

                {/* Header */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg">
                            🩺
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Hàng đợi khám</h1>
                            <p className="text-gray-500 text-sm">
                                BS. <span className="font-semibold text-indigo-600">{user?.name}</span>
                                {user?.specialty && <span className="text-gray-400 ml-1">• {user.specialty}</span>}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchQueue}
                        className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition shadow-sm"
                    >
                        🔄 Làm mới
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: "Đang chờ",    count: waiting,    color: "from-amber-400 to-orange-500",   icon: "⏳" },
                        { label: "Đang khám",   count: inProgress, color: "from-purple-500 to-indigo-600",  icon: "🩺" },
                        { label: "Hoàn thành",  count: completed,  color: "from-emerald-400 to-teal-500",   icon: "✅" },
                    ].map(s => (
                        <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-md`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium opacity-90">{s.label}</span>
                                <span className="text-lg">{s.icon}</span>
                            </div>
                            <p className="text-4xl font-black">{s.count}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    {[
                        { key: "active", label: "Đang hoạt động", count: active.length, badge: "bg-indigo-500" },
                        { key: "done",   label: "Đã xử lý hôm nay", count: done.length,   badge: "bg-gray-400" },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                                activeTab === t.key
                                    ? "bg-white shadow-md text-gray-800 border border-gray-200"
                                    : "text-gray-500 hover:bg-white/60"
                            }`}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span className={`${t.badge} text-white text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                    </div>
                ) : list.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                        <div className="text-5xl mb-3">{activeTab === "active" ? "🎉" : "📋"}</div>
                        <p className="text-gray-500 font-medium">
                            {activeTab === "active" ? "Không có bệnh nhân đang chờ" : "Chưa có lịch sử hôm nay"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {list.map(entry => (
                            <QueueCard
                                key={entry._id}
                                entry={entry}
                                onStatusChange={handleStatusChange}
                                isUpdating={updatingId === entry._id}
                                navigate={navigate}
                            />
                        ))}
                    </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-6">🔄 Tự động cập nhật mỗi 30 giây</p>
            </div>
        </div>
    );
}
