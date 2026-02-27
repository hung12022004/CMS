import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

// Mock data bệnh nhân
const mockPatients = [
    {
        id: 1,
        name: "Lê Văn C",
        email: "patient@clinic.com",
        phone: "0909123456",
        gender: "male",
        dob: "1990-05-15",
        bloodType: "A+",
        appointment: {
            date: "2026-02-24",
            time: "09:00",
            doctor: "BS. Nguyễn Văn A",
            specialty: "Tim mạch",
            status: "confirmed",
        },
        vitals: { bp: "120/80", heartRate: 72, height: 170, weight: 68 },
    },
    {
        id: 2,
        name: "Trần Thị D",
        email: "trand@email.com",
        phone: "0909234567",
        gender: "female",
        dob: "1985-08-22",
        bloodType: "O+",
        appointment: {
            date: "2026-02-24",
            time: "09:30",
            doctor: "BS. Nguyễn Văn A",
            specialty: "Tim mạch",
            status: "pending",
        },
        vitals: { bp: "", heartRate: null, height: null, weight: null },
    },
    {
        id: 3,
        name: "Phạm Minh E",
        email: "phame@email.com",
        phone: "0909345678",
        gender: "male",
        dob: "1978-12-03",
        bloodType: "B+",
        appointment: {
            date: "2026-02-24",
            time: "10:00",
            doctor: "BS. Trần Thị Bình",
            specialty: "Nhi khoa",
            status: "checked_in",
        },
        vitals: { bp: "130/85", heartRate: 78, height: 175, weight: 82 },
    },
    {
        id: 4,
        name: "Nguyễn Thị F",
        email: "nguyenf@email.com",
        phone: "0909456789",
        gender: "female",
        dob: "1995-03-18",
        bloodType: "AB+",
        appointment: {
            date: "2026-02-24",
            time: "10:30",
            doctor: "BS. Lê Hoàng Cường",
            specialty: "Nha khoa",
            status: "in_progress",
        },
        vitals: { bp: "110/70", heartRate: 68, height: 160, weight: 52 },
    },
    {
        id: 5,
        name: "Hoàng Văn G",
        email: "hoangg@email.com",
        phone: "0909567890",
        gender: "male",
        dob: "2000-07-25",
        bloodType: "O-",
        appointment: {
            date: "2026-02-24",
            time: "11:00",
            doctor: "BS. Nguyễn Văn A",
            specialty: "Tim mạch",
            status: "completed",
        },
        vitals: { bp: "125/82", heartRate: 75, height: 180, weight: 78 },
    },
];

const STATUS_CONFIG = {
    pending: { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-700", icon: "🕐" },
    confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700", icon: "✅" },
    checked_in: { label: "Đã check-in", color: "bg-emerald-100 text-emerald-700", icon: "📋" },
    in_progress: { label: "Đang khám", color: "bg-purple-100 text-purple-700", icon: "🩺" },
    completed: { label: "Hoàn thành", color: "bg-gray-100 text-gray-600", icon: "✔️" },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: "❌" },
};

export default function NursePatientsPage() {
    const { user } = useAuth();
    const [patients, setPatients] = useState(mockPatients);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [search, setSearch] = useState("");
    const [editingVitals, setEditingVitals] = useState(null);
    const [vitalsForm, setVitalsForm] = useState({ bp: "", heartRate: "", height: "", weight: "" });

    // Đọc appointments từ localStorage và merge với mock data
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("cms_appointments") || "[]");
        if (stored.length > 0) {
            const lsPatients = stored
                .filter(a => a.status !== "cancelled") // bỏ lịch đã hủy
                .map((a, idx) => ({
                    id: `ls_${a.id}`,
                    name: a.patient?.name || "Bệnh nhân",
                    email: "",
                    phone: a.patient?.phone || "",
                    gender: a.patient?.gender === "Nữ" ? "female" : "male",
                    dob: "",
                    bloodType: "",
                    appointment: {
                        date: a.date,
                        time: a.time,
                        doctor: a.doctor?.name || "",
                        specialty: a.doctor?.specialty || "",
                        status: a.status || "pending",
                    },
                    vitals: { bp: "", heartRate: null, height: null, weight: null },
                    _lsId: a.id, // giữ id gốc để sync lại localStorage
                }));
            setPatients([...lsPatients, ...mockPatients]);
        }
    }, []);

    const filteredPatients = patients.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.phone.includes(search)
    );

    const handleStatusChange = (patientId, newStatus) => {
        setPatients((prev) =>
            prev.map((p) =>
                p.id === patientId
                    ? { ...p, appointment: { ...p.appointment, status: newStatus } }
                    : p
            )
        );
        // Sync lại localStorage nếu là bệnh nhân từ booking
        const patient = patients.find(p => p.id === patientId);
        if (patient && patient._lsId) {
            const stored = JSON.parse(localStorage.getItem("cms_appointments") || "[]");
            const updated = stored.map(a => a.id === patient._lsId ? { ...a, status: newStatus } : a);
            localStorage.setItem("cms_appointments", JSON.stringify(updated));
        }
    };

    const handleVitalsEdit = (patient) => {
        setEditingVitals(patient.id);
        setVitalsForm({
            bp: patient.vitals.bp || "",
            heartRate: patient.vitals.heartRate || "",
            height: patient.vitals.height || "",
            weight: patient.vitals.weight || "",
        });
    };

    const handleVitalsSave = (patientId) => {
        setPatients((prev) =>
            prev.map((p) =>
                p.id === patientId
                    ? {
                        ...p,
                        vitals: {
                            bp: vitalsForm.bp,
                            heartRate: Number(vitalsForm.heartRate) || null,
                            height: Number(vitalsForm.height) || null,
                            weight: Number(vitalsForm.weight) || null,
                        },
                    }
                    : p
            )
        );
        setEditingVitals(null);
    };

    const handleReschedule = (patientId) => {
        const newTime = prompt("Nhập giờ khám mới (VD: 14:00):");
        if (newTime) {
            setPatients((prev) =>
                prev.map((p) =>
                    p.id === patientId
                        ? { ...p, appointment: { ...p.appointment, time: newTime } }
                        : p
                )
            );
            // Sync localStorage
            const patient = patients.find(p => p.id === patientId);
            if (patient && patient._lsId) {
                const stored = JSON.parse(localStorage.getItem("cms_appointments") || "[]");
                const updated = stored.map(a => a.id === patient._lsId ? { ...a, time: newTime } : a);
                localStorage.setItem("cms_appointments", JSON.stringify(updated));
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Danh sách bệnh nhân
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Quản lý, cập nhật sinh hiệu và trạng thái khám
                    </p>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm theo tên hoặc SĐT..."
                        className="w-full md:w-96 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition shadow-sm"
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const count = patients.filter((p) => p.appointment.status === key).length;
                        return (
                            <div key={key} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{config.icon}</span>
                                    <div>
                                        <p className="text-xs text-gray-500">{config.label}</p>
                                        <p className="text-lg font-bold text-gray-800">{count}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Patient List */}
                    <div className="flex-1">
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Bệnh nhân</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Giờ khám</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Bác sĩ</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatients.map((p) => {
                                        const status = STATUS_CONFIG[p.appointment.status];
                                        return (
                                            <tr
                                                key={p.id}
                                                className={`border-b hover:bg-blue-50/50 transition cursor-pointer ${selectedPatient?.id === p.id ? "bg-blue-50" : ""
                                                    }`}
                                                onClick={() => setSelectedPatient(p)}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                                            {p.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
                                                            <p className="text-xs text-gray-400">{p.phone}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                                                    {p.appointment.time}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700">{p.appointment.doctor}</p>
                                                    <p className="text-xs text-gray-400">{p.appointment.specialty}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                                                        <span>{status.icon}</span> {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            value={p.appointment.status}
                                                            onChange={(e) => handleStatusChange(p.id, e.target.value)}
                                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400 cursor-pointer"
                                                        >
                                                            <option value="pending">Chờ xác nhận</option>
                                                            <option value="confirmed">Xác nhận</option>
                                                            <option value="checked_in">Check-in</option>
                                                            <option value="in_progress">Đang khám</option>
                                                            <option value="completed">Hoàn thành</option>
                                                            <option value="cancelled">Hủy</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleReschedule(p.id)}
                                                            className="text-xs px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Đổi lịch"
                                                        >
                                                            🔄
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {filteredPatients.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    Không tìm thấy bệnh nhân nào
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Patient Detail Panel */}
                    {selectedPatient && (
                        <div className="w-full lg:w-96">
                            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                                {/* Patient Info Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                                        {selectedPatient.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{selectedPatient.name}</h3>
                                        <p className="text-sm text-gray-500">{selectedPatient.email}</p>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-400">SĐT</p>
                                        <p className="text-sm font-medium text-gray-700">{selectedPatient.phone}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-400">Giới tính</p>
                                        <p className="text-sm font-medium text-gray-700">
                                            {selectedPatient.gender === "male" ? "Nam" : "Nữ"}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-400">Ngày sinh</p>
                                        <p className="text-sm font-medium text-gray-700">
                                            {new Date(selectedPatient.dob).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-400">Nhóm máu</p>
                                        <p className="text-sm font-medium text-gray-700">{selectedPatient.bloodType}</p>
                                    </div>
                                </div>

                                {/* Appointment Info */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        📅 Lịch hẹn hôm nay
                                    </h4>
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-blue-800">
                                                {selectedPatient.appointment.time} — {selectedPatient.appointment.doctor}
                                            </span>
                                        </div>
                                        <p className="text-xs text-blue-600">{selectedPatient.appointment.specialty}</p>
                                    </div>
                                </div>

                                {/* Vitals */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            💓 Sinh hiệu sơ bộ
                                        </h4>
                                        {editingVitals !== selectedPatient.id ? (
                                            <button
                                                onClick={() => handleVitalsEdit(selectedPatient)}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Cập nhật
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleVitalsSave(selectedPatient.id)}
                                                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                                            >
                                                ✓ Lưu
                                            </button>
                                        )}
                                    </div>

                                    {editingVitals === selectedPatient.id ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-gray-500">Huyết áp</label>
                                                <input
                                                    value={vitalsForm.bp}
                                                    onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
                                                    placeholder="120/80"
                                                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Nhịp tim</label>
                                                <input
                                                    type="number"
                                                    value={vitalsForm.heartRate}
                                                    onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                                                    placeholder="72"
                                                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Chiều cao (cm)</label>
                                                <input
                                                    type="number"
                                                    value={vitalsForm.height}
                                                    onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })}
                                                    placeholder="170"
                                                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Cân nặng (kg)</label>
                                                <input
                                                    type="number"
                                                    value={vitalsForm.weight}
                                                    onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                                                    placeholder="68"
                                                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-red-50 rounded-xl p-3 text-center">
                                                <p className="text-xs text-red-400">Huyết áp</p>
                                                <p className="text-lg font-bold text-red-600">
                                                    {selectedPatient.vitals.bp || "—"}
                                                </p>
                                            </div>
                                            <div className="bg-pink-50 rounded-xl p-3 text-center">
                                                <p className="text-xs text-pink-400">Nhịp tim</p>
                                                <p className="text-lg font-bold text-pink-600">
                                                    {selectedPatient.vitals.heartRate ? `${selectedPatient.vitals.heartRate} bpm` : "—"}
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                                                <p className="text-xs text-blue-400">Chiều cao</p>
                                                <p className="text-lg font-bold text-blue-600">
                                                    {selectedPatient.vitals.height ? `${selectedPatient.vitals.height} cm` : "—"}
                                                </p>
                                            </div>
                                            <div className="bg-green-50 rounded-xl p-3 text-center">
                                                <p className="text-xs text-green-400">Cân nặng</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {selectedPatient.vitals.weight ? `${selectedPatient.vitals.weight} kg` : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
