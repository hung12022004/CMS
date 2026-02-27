import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getMedicalRecordsApi, createMedicalRecordApi } from "../services/medicalRecord.api";
import { getPatientsApi } from "../services/user.api";
import { updateAppointmentStatusApi } from "../services/appointment.api";

// Mock medical records - Doctor view
const mockDoctorRecords = [
    {
        id: 1,
        date: "2026-01-20",
        patient: {
            name: "Lê Văn C",
            age: 30,
            gender: "Nam",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
        },
        diagnosis: "Viêm nướu răng mức độ nhẹ",
        symptoms: ["Đau răng", "Chảy máu nướu", "Hôi miệng"],
        prescriptions: [
            { name: "Amoxicillin 500mg", dosage: "2 viên/ngày", duration: "7 ngày" },
            { name: "Paracetamol 500mg", dosage: "Khi đau", duration: "Khi cần" },
        ],
        tests: [
            { name: "X-quang răng", result: "Không phát hiện sâu răng", file: "xray_dental.pdf" },
        ],
        notes: "Tái khám sau 2 tuần. Hướng dẫn bệnh nhân đánh răng đúng cách.",
    },
    {
        id: 2,
        date: "2026-01-10",
        patient: {
            name: "Trần Thị D",
            age: 41,
            gender: "Nữ",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
        },
        diagnosis: "Viêm da dị ứng cấp tính",
        symptoms: ["Ngứa da", "Phát ban đỏ", "Sưng nhẹ"],
        prescriptions: [
            { name: "Loratadine 10mg", dosage: "1 viên/ngày", duration: "14 ngày" },
            { name: "Hydrocortisone cream 1%", dosage: "Bôi 2 lần/ngày", duration: "7 ngày" },
        ],
        tests: [],
        notes: "Tránh tiếp xúc với chất gây dị ứng. Tái khám nếu không cải thiện sau 1 tuần.",
    },
    {
        id: 3,
        date: "2025-12-15",
        patient: {
            name: "Nguyễn Thị F",
            age: 31,
            gender: "Nữ",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
        },
        diagnosis: "Tăng huyết áp độ 1",
        symptoms: ["Đau đầu", "Chóng mặt", "Mệt mỏi"],
        prescriptions: [
            { name: "Amlodipine 5mg", dosage: "1 viên/sáng", duration: "30 ngày" },
            { name: "Aspirin 81mg", dosage: "1 viên/tối", duration: "30 ngày" },
        ],
        tests: [
            { name: "Điện tâm đồ (ECG)", result: "Nhịp tim bình thường", file: "ecg_result.pdf" },
            { name: "Xét nghiệm máu", result: "Cholesterol: 5.2 mmol/L", file: "blood_test.pdf" },
        ],
        notes: "Theo dõi huyết áp hàng ngày. Giảm muối, tập thể dục đều đặn. Tái khám sau 1 tháng.",
    },
];

export default function MedicalRecordsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    // State
    const [records, setRecords] = useState([]);
    const [patientsList, setPatientsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [activeAccordion, setActiveAccordion] = useState({});
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formPatientId, setFormPatientId] = useState("");
    const [formAppointmentId, setFormAppointmentId] = useState(null);
    const [formDiagnosis, setFormDiagnosis] = useState("");
    const [formSymptomInput, setFormSymptomInput] = useState("");
    const [formSymptoms, setFormSymptoms] = useState([]);
    const [formNotes, setFormNotes] = useState("");

    const isDoctor = user?.role === "doctor";
    const isStaff = user?.role === "doctor" || user?.role === "nurse" || user?.role === "admin";

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [recordsRes, patientsRes] = await Promise.all([
                    getMedicalRecordsApi(),
                    isDoctor ? getPatientsApi() : Promise.resolve({ patients: [] })
                ]);
                const allRecords = recordsRes.records || [];
                setRecords(isStaff ? allRecords : allRecords.filter(r => r.patientId?.email === user?.email || r.patient?.email === user?.email));
                setPatientsList(patientsRes.patients || []);

                // Check if we came from Appointments with a patient
                const locationState = window.history.state?.usr; // Simple way to access location state in this context
                if (locationState?.patientId && isDoctor) {
                    setFormPatientId(locationState.patientId);
                    if (locationState.appointmentId) {
                        setFormAppointmentId(locationState.appointmentId);
                    }
                    setShowForm(true);
                }
            } catch (err) {
                console.error("Error fetching medical records data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isDoctor]);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
    };

    const toggleAccordion = (recordId, section) => {
        setActiveAccordion((prev) => ({
            ...prev,
            [`${recordId}-${section}`]: !prev[`${recordId}-${section}`],
        }));
    };

    const isAccordionOpen = (recordId, section) => {
        return activeAccordion[`${recordId}-${section}`] || false;
    };

    // Form handlers
    const addSymptom = () => {
        const s = formSymptomInput.trim();
        if (s && !formSymptoms.includes(s)) {
            setFormSymptoms([...formSymptoms, s]);
            setFormSymptomInput("");
        }
    };

    const removeSymptom = (idx) => {
        setFormSymptoms(formSymptoms.filter((_, i) => i !== idx));
    };

    const handleSymptomKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSymptom();
        }
    };

    const handleSaveRecord = async () => {
        if (!formPatientId || !formDiagnosis.trim()) return;

        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        try {
            const res = await createMedicalRecordApi({
                patientId: formPatientId,
                diagnosis: formDiagnosis.trim(),
                symptoms: formSymptoms,
                notes: formNotes.trim(),
                date: dateStr,
            });

            if (res.record) {
                // If this is linked to an appointment, complete it
                if (formAppointmentId) {
                    try {
                        await updateAppointmentStatusApi(formAppointmentId, "completed");
                    } catch (err) {
                        console.error("Failed to complete appointment automatically:", err);
                    }
                }

                // Refresh list
                const recordsRes = await getMedicalRecordsApi();
                setRecords(recordsRes.records || []);

                // Reset form
                setFormPatientId("");
                setFormAppointmentId(null);
                setFormDiagnosis("");
                setFormSymptoms([]);
                setFormSymptomInput("");
                setFormNotes("");
                setShowForm(false);
            }
        } catch (err) {
            console.error("Error saving medical record:", err);
            alert("Có lỗi xảy ra khi lưu hồ sơ");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            {isStaff ? "Hồ sơ bệnh án bệnh nhân" : "Hồ sơ bệnh án"}
                        </h1>
                        <p className="text-gray-500">
                            {isStaff ? "Quản lý và kê hồ sơ cho bệnh nhân" : "Lịch sử khám và kết quả điều trị"}
                        </p>
                    </div>
                    {isDoctor && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
                        >
                            {showForm ? "✕ Đóng" : "+ Tạo hồ sơ mới"}
                        </button>
                    )}
                </div>

                {/* ========== NEW RECORD FORM ========== */}
                {showForm && isDoctor && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-blue-200 animate-fade-in">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            🩺 Tạo hồ sơ bệnh án mới
                        </h2>

                        {/* Patient Select */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn bệnh nhân *</label>
                            <select
                                value={formPatientId}
                                onChange={e => setFormPatientId(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 bg-white"
                            >
                                <option value="">-- Chọn bệnh nhân --</option>
                                {patientsList.map((p) => (
                                    <option key={p._id} value={p._id}>
                                        {p.name} ({p.phoneNumber || p.email})
                                    </option>
                                ))}
                            </select>
                            {patientsList.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">Chưa có bệnh nhân nào đăng ký tài khoản</p>
                            )}
                        </div>

                        {/* Diagnosis */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chẩn đoán / Tình trạng *</label>
                            <input
                                type="text"
                                value={formDiagnosis}
                                onChange={e => setFormDiagnosis(e.target.value)}
                                placeholder="VD: Viêm họng cấp, Cảm cúm nhẹ..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-700"
                            />
                        </div>

                        {/* Symptoms */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Triệu chứng</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formSymptomInput}
                                    onChange={e => setFormSymptomInput(e.target.value)}
                                    onKeyDown={handleSymptomKeyDown}
                                    placeholder="Nhập triệu chứng, bấm Enter để thêm..."
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-700 text-sm"
                                />
                                <button
                                    onClick={addSymptom}
                                    className="px-4 py-2.5 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors text-sm font-medium"
                                >
                                    + Thêm
                                </button>
                            </div>
                            {formSymptoms.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formSymptoms.map((s, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                                        >
                                            {s}
                                            <button
                                                onClick={() => removeSymptom(i)}
                                                className="ml-1 text-blue-400 hover:text-red-500"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú / Chú thích cho bệnh nhân</label>
                            <textarea
                                value={formNotes}
                                onChange={e => setFormNotes(e.target.value)}
                                placeholder="VD: Tái khám sau 1 tuần, uống nhiều nước, nghỉ ngơi..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-700 resize-none"
                            />
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveRecord}
                                disabled={!formPatientId || !formDiagnosis.trim()}
                                className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-colors ${formPatientId && formDiagnosis.trim()
                                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg"
                                    : "bg-gray-300 cursor-not-allowed"
                                    }`}
                            >
                                ✅ Lưu hồ sơ
                            </button>
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200" />

                    {/* Records */}
                    <div className="space-y-6">
                        {records.map((record, index) => (
                            <div
                                key={record._id || record.id}
                                className="relative pl-16 animate-fade-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Timeline Dot */}
                                <div className="absolute left-4 top-6 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow" />

                                {/* Record Card */}
                                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    {/* Header */}
                                    <div
                                        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => setExpandedId(expandedId === (record._id || record.id) ? null : (record._id || record.id))}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-blue-600 font-semibold">
                                                {formatDate(record.date)}
                                            </span>
                                            <svg
                                                className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === (record._id || record.id) ? "rotate-180" : ""}`}
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {(record.patientId?.avatarUrl || record.patient?.avatar) ? (
                                                <img
                                                    src={isStaff ? (record.patientId?.avatarUrl || record.patient?.avatar) : (record.doctorId?.avatarUrl || record.doctor?.avatar)}
                                                    alt={isStaff ? (record.patientId?.name || record.patient?.name) : (record.doctorId?.name || record.doctor?.name)}
                                                    className="w-12 h-12 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                                                    {(record.patientId?.name || record.patient?.name || "?")[0]}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-gray-800">
                                                    {isStaff ? (record.patientId?.name || record.patient?.name) : (record.doctorId?.name || record.doctor || "Bác sĩ")}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {isStaff
                                                        ? ((record.patientId?.gender || record.patient?.gender) && (record.patientId?.age || record.patient?.age) ? `${record.patientId?.gender || record.patient?.gender}, ${record.patientId?.age || record.patient?.age} tuổi` : "Bệnh nhân")
                                                        : ""
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                                            <p className="text-sm text-gray-500">Chẩn đoán</p>
                                            <p className="font-semibold text-gray-800">{record.diagnosis}</p>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedId === (record._id || record.id) && (
                                        <div className="border-t px-5 py-4 space-y-4 animate-fade-in">
                                            {/* Symptoms Accordion */}
                                            {(record.symptoms?.length || 0) > 0 && (
                                                <div className="border rounded-xl overflow-hidden">
                                                    <button
                                                        onClick={() => toggleAccordion((record._id || record.id), "symptoms")}
                                                        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <span className="font-medium text-gray-700">
                                                            📋 Triệu chứng ({record.symptoms.length})
                                                        </span>
                                                        <svg
                                                            className={`w-4 h-4 text-gray-400 transition-transform ${isAccordionOpen((record._id || record.id), "symptoms") ? "rotate-180" : ""}`}
                                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                    {isAccordionOpen((record._id || record.id), "symptoms") && (
                                                        <div className="p-4 space-y-2">
                                                            {record.symptoms.map((symptom, i) => (
                                                                <div key={i} className="flex items-center gap-2">
                                                                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                                                    <span className="text-gray-600">{symptom}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Prescriptions Accordion */}
                                            {(record.prescriptions?.length || 0) > 0 && (
                                                <div className="border rounded-xl overflow-hidden">
                                                    <button
                                                        onClick={() => toggleAccordion((record._id || record.id), "prescriptions")}
                                                        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <span className="font-medium text-gray-700">
                                                            💊 Đơn thuốc ({record.prescriptions.length})
                                                        </span>
                                                        <svg
                                                            className={`w-4 h-4 text-gray-400 transition-transform ${isAccordionOpen((record._id || record.id), "prescriptions") ? "rotate-180" : ""}`}
                                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                    {isAccordionOpen((record._id || record.id), "prescriptions") && (
                                                        <div className="p-4 space-y-3">
                                                            {record.prescriptions.map((med, i) => (
                                                                <div key={i} className="p-3 bg-orange-50 rounded-lg">
                                                                    <p className="font-semibold text-gray-800">{med.name}</p>
                                                                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                                                                        <span>📏 {med.dosage}</span>
                                                                        <span>⏱️ {med.duration}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Tests Accordion */}
                                            {(record.tests?.length || 0) > 0 && (
                                                <div className="border rounded-xl overflow-hidden">
                                                    <button
                                                        onClick={() => toggleAccordion((record._id || record.id), "tests")}
                                                        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <span className="font-medium text-gray-700">
                                                            🔬 Kết quả xét nghiệm ({record.tests.length})
                                                        </span>
                                                        <svg
                                                            className={`w-4 h-4 text-gray-400 transition-transform ${isAccordionOpen((record._id || record.id), "tests") ? "rotate-180" : ""}`}
                                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                    {isAccordionOpen((record._id || record.id), "tests") && (
                                                        <div className="p-4 space-y-3">
                                                            {record.tests.map((test, i) => (
                                                                <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                                                    <div>
                                                                        <p className="font-semibold text-gray-800">{test.name}</p>
                                                                        <p className="text-sm text-gray-600">{test.result}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {record.notes && (
                                                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                                    <p className="text-sm font-medium text-yellow-800 mb-1">📝 Ghi chú bác sĩ</p>
                                                    <p className="text-gray-700">{record.notes}</p>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => navigate("/prescriptions")}
                                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                                >
                                                    Xem đơn thuốc
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Empty State */}
                {records.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            Chưa có hồ sơ bệnh án
                        </h3>
                        <p className="text-gray-500">
                            Hồ sơ sẽ được cập nhật sau mỗi lần khám
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
