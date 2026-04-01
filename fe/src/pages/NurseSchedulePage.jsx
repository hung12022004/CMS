import { useState, useEffect, useCallback } from "react";
import { getDoctorsApi } from "../services/user.api";
import { getSchedulesApi, upsertScheduleApi, deleteScheduleApi } from "../services/schedule.api";

// ─── Helpers ────────────────────────────────────────────────────────────────
function getNextWeekRange() {
    const today = new Date();
    // Monday of next week
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    const daysUntilNextMon = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysUntilNextMon);

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
}

function getThisWeekRange() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMon);

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
}

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const DAY_FULL = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

function formatDate(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}`;
}

// ─── Edit Modal ─────────────────────────────────────────────────────────────
function EditSlotModal({ slot, onClose, onSaved }) {
    const [form, setForm] = useState({
        isWorking: slot?.isWorking ?? true,
        startTime: slot?.startTime || "08:00",
        endTime: slot?.endTime || "17:00",
        notes: slot?.notes || "",
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await upsertScheduleApi({
                doctorId: slot.doctorId,
                date: slot.date,
                ...form,
            });
            onSaved(result.schedule);
        } catch (err) {
            console.error("upsertSchedule error:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-5 text-white">
                    <h3 className="font-bold text-lg">Chỉnh lịch làm việc</h3>
                    <p className="text-teal-100 text-sm mt-0.5">
                        {DAY_FULL[slot.dayIndex]} — {formatDate(slot.date)}
                    </p>
                    <p className="text-white font-semibold mt-1">BS. {slot.doctorName}</p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Working / Day off toggle */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setForm((f) => ({ ...f, isWorking: true }))}
                            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition border-2 ${form.isWorking ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                        >
                            ✅ Làm việc
                        </button>
                        <button
                            onClick={() => setForm((f) => ({ ...f, isWorking: false }))}
                            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition border-2 ${!form.isWorking ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                        >
                            🚫 Ngày nghỉ
                        </button>
                    </div>

                    {form.isWorking && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Giờ bắt đầu</label>
                                <input
                                    type="time"
                                    value={form.startTime}
                                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-teal-400"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Giờ kết thúc</label>
                                <input
                                    type="time"
                                    value={form.endTime}
                                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-teal-400"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Ghi chú (tuỳ chọn)</label>
                        <input
                            value={form.notes}
                            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                            placeholder="VD: Trực cấp cứu, ngoài giờ..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-teal-400"
                        />
                    </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
                        Huỷ
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-semibold text-sm hover:from-teal-600 hover:to-cyan-700 transition disabled:opacity-50"
                    >
                        {saving ? "Đang lưu..." : "✓ Lưu lịch"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Import Modal ───────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported, defaultStartDate }) {
    const [file, setFile] = useState(null);
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!file || !startDate) {
            alert("Vui lòng chọn file và ngày bắt đầu (Thứ 2)");
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("startDate", startDate);

            const token = localStorage.getItem("accessToken");

            // Thêm Base URL của Backend (ví dụ: localhost:5000)
            const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/v1/schedules/import`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            // Đọc dữ liệu dạng text trước để tránh lỗi sập "Unexpected end of JSON input"
            const text = await res.text();
            let data = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch (err) {
                throw new Error("Lỗi máy chủ: Máy chủ không trả về định dạng JSON.");
            }

            if (!res.ok) throw new Error(data.message || "Lỗi khi import");

            alert(data.message);
            onImported();
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-5 text-white">
                    <h3 className="font-bold text-lg">Import Lịch Từ Excel</h3>
                    <p className="text-teal-100 text-sm mt-0.5">Tải lên file định dạng .xlsx hoặc .csv</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 block">Ngày đầu tuần (Thứ 2)</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-teal-400" />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 block">File Excel</label>
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => setFile(e.target.files[0])} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-teal-400" />
                    </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">Huỷ</button>
                    <button onClick={handleUpload} disabled={uploading} className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-semibold text-sm hover:from-teal-600 hover:to-cyan-700 transition disabled:opacity-50">
                        {uploading ? "Đang xử lý..." : "📥 Import"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function NurseSchedulePage() {
    const [doctors, setDoctors] = useState([]);
    const [schedules, setSchedules] = useState([]); // flat list from API
    const [loading, setLoading] = useState(true);
    const [weekMode, setWeekMode] = useState("next"); // "this" | "next"
    const [editSlot, setEditSlot] = useState(null);
    const [showImport, setShowImport] = useState(false);

    const weekDates = weekMode === "next" ? getNextWeekRange() : getThisWeekRange();
    const startDate = weekDates[0];
    const endDate = weekDates[6];

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [doctorRes, schedRes] = await Promise.all([
                getDoctorsApi(),
                getSchedulesApi({ startDate, endDate }),
            ]);
            setDoctors(doctorRes.doctors || []);
            setSchedules(schedRes.schedules || []);
        } catch (err) {
            console.error("fetchAll error:", err);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Build a lookup: scheduleMap[doctorId][date] = schedule object
    const scheduleMap = {};
    schedules.forEach((s) => {
        const did = typeof s.doctorId === "object" ? s.doctorId._id : s.doctorId;
        if (!scheduleMap[did]) scheduleMap[did] = {};
        scheduleMap[did][s.date] = s;
    });

    const handleCellClick = (doctor, date, dayIndex) => {
        const existing = scheduleMap[doctor._id]?.[date];
        setEditSlot({
            doctorId: doctor._id,
            doctorName: doctor.name,
            date,
            dayIndex,
            isWorking: existing?.isWorking ?? true,
            startTime: existing?.startTime ?? "08:00",
            endTime: existing?.endTime ?? "17:00",
            notes: existing?.notes ?? "",
            _scheduleId: existing?._id,
        });
    };

    const handleSaved = (updatedSchedule) => {
        setSchedules((prev) => {
            const idx = prev.findIndex((s) => s._id === updatedSchedule._id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = updatedSchedule;
                return next;
            }
            return [...prev, updatedSchedule];
        });
        setEditSlot(null);
    };

    const handleDelete = async (scheduleId) => {
        try {
            await deleteScheduleApi(scheduleId);
            setSchedules((prev) => prev.filter((s) => s._id !== scheduleId));
            setEditSlot(null);
        } catch (err) {
            console.error("deleteSchedule error:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-2xl shadow-lg">
                            📅
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Lịch làm việc bác sĩ</h1>
                            <p className="text-gray-500 text-sm">
                                {weekMode === "next" ? "Tuần tới" : "Tuần này"} &nbsp;•&nbsp;
                                {formatDate(startDate)} – {formatDate(endDate)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowImport(true)}
                            className="px-4 py-2 text-sm bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition shadow-sm flex items-center gap-2"
                        >
                            📥 Import Excel
                        </button>
                        {/* Week toggle */}
                        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            {[
                                { key: "this", label: "Tuần này" },
                                { key: "next", label: "Tuần tới" },
                            ].map((w) => (
                                <button
                                    key={w.key}
                                    onClick={() => setWeekMode(w.key)}
                                    className={`px-4 py-2 text-sm font-semibold transition ${weekMode === w.key ? "bg-teal-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchAll}
                            className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600 transition shadow-sm"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-4 mb-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-500 inline-block"></span> Làm việc</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block"></span> Ngày nghỉ</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 inline-block"></span> Chưa xếp lịch</span>
                    <span className="text-gray-400 ml-2">Click vào ô để chỉnh lịch</span>
                </div>

                {/* Schedule Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600 w-44">Bác sĩ</th>
                                    {weekDates.map((date, i) => {
                                        const isToday = date === new Date().toISOString().slice(0, 10);
                                        return (
                                            <th key={date} className={`text-center px-2 py-4 text-xs font-semibold ${isToday ? "text-teal-600" : "text-gray-500"}`}>
                                                <div className={`font-bold text-sm ${isToday ? "text-teal-600" : i >= 5 ? "text-red-400" : "text-gray-700"}`}>
                                                    {DAY_LABELS[i]}
                                                </div>
                                                <div className={`text-xs mt-0.5 ${isToday ? "bg-teal-500 text-white rounded-full px-2 py-0.5" : ""}`}>
                                                    {formatDate(date)}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-gray-400">Không có bác sĩ nào</td>
                                    </tr>
                                ) : (
                                    doctors.map((doctor, dIdx) => (
                                        <tr key={doctor._id} className={`border-b border-gray-100 ${dIdx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                                            {/* Doctor name column */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                        {doctor.name[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{doctor.name}</p>
                                                        <p className="text-xs text-gray-400 truncate">{doctor.specialty || "Đa khoa"}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Day cells */}
                                            {weekDates.map((date, dayIdx) => {
                                                const slot = scheduleMap[doctor._id]?.[date];
                                                const isWeekend = dayIdx >= 5;

                                                if (!slot) {
                                                    return (
                                                        <td key={date} className="px-2 py-3 text-center">
                                                            <button
                                                                onClick={() => handleCellClick(doctor, date, dayIdx)}
                                                                className={`w-full min-h-[56px] rounded-xl border-2 border-dashed transition hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center ${isWeekend ? "border-gray-200 bg-gray-50" : "border-gray-200"}`}
                                                            >
                                                                <span className="text-xs text-gray-300 hover:text-teal-400">+</span>
                                                            </button>
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={date} className="px-2 py-3 text-center">
                                                        <button
                                                            onClick={() => handleCellClick(doctor, date, dayIdx)}
                                                            className={`w-full min-h-[56px] rounded-xl border-2 transition text-xs font-medium flex flex-col items-center justify-center gap-0.5 ${slot.isWorking
                                                                ? "border-teal-400 bg-teal-50 text-teal-700 hover:bg-teal-100"
                                                                : "border-red-300 bg-red-50 text-red-500 hover:bg-red-100"
                                                                }`}
                                                        >
                                                            {slot.isWorking ? (
                                                                <>
                                                                    <span className="text-base">✅</span>
                                                                    <span>{slot.startTime} – {slot.endTime}</span>
                                                                    {slot.notes && <span className="text-gray-400 text-[10px] truncate max-w-[70px]">{slot.notes}</span>}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-base">🚫</span>
                                                                    <span>Nghỉ</span>
                                                                    {slot.notes && <span className="text-[10px] truncate max-w-[70px]">{slot.notes}</span>}
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Summary stats */}
                {!loading && doctors.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {[
                            {
                                label: "Ngày làm được xếp",
                                count: schedules.filter((s) => s.isWorking).length,
                                color: "from-teal-400 to-cyan-500", icon: "✅"
                            },
                            {
                                label: "Ngày nghỉ",
                                count: schedules.filter((s) => !s.isWorking).length,
                                color: "from-red-400 to-rose-500", icon: "🚫"
                            },
                            {
                                label: "Chưa xếp lịch",
                                count: (doctors.length * 7) - schedules.length,
                                color: "from-gray-400 to-slate-500", icon: "📋"
                            },
                        ].map((s) => (
                            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-md`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium opacity-90">{s.label}</span>
                                    <span className="text-lg">{s.icon}</span>
                                </div>
                                <p className="text-4xl font-black">{s.count}</p>
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-6">
                    Click vào ô bất kỳ để xếp lịch hoặc đánh dấu ngày nghỉ cho bác sĩ
                </p>
            </div>

            {/* Edit Modal */}
            {editSlot && (
                <EditSlotModal
                    slot={editSlot}
                    onClose={() => setEditSlot(null)}
                    onSaved={handleSaved}
                    onDelete={editSlot._scheduleId ? () => handleDelete(editSlot._scheduleId) : null}
                />
            )}

            {/* Import Modal */}
            {showImport && (
                <ImportModal
                    onClose={() => setShowImport(false)}
                    onImported={() => {
                        setShowImport(false);
                        fetchAll();
                    }}
                    defaultStartDate={startDate}
                />
            )}
        </div>
    );
}
