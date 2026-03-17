import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getMedicalRecordsApi, createMedicalRecordApi } from "../services/medicalRecord.api";
import { getPatientsApi } from "../services/user.api";
import { updateAppointmentStatusApi } from "../services/appointment.api";

export default function MedicalRecordsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    
    // State
    const [records, setRecords] = useState([]);
    const [patientsList, setPatientsList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [selectedRecordId, setSelectedRecordId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [recordSearchText, setRecordSearchText] = useState("");
    const [recordSearchMonth, setRecordSearchMonth] = useState("");

    // Form state
    const [formPatientId, setFormPatientId] = useState("");
    const [formAppointmentId, setFormAppointmentId] = useState(null);
    const [formDiagnosis, setFormDiagnosis] = useState("");
    const [formSymptomInput, setFormSymptomInput] = useState("");
    const [formSymptoms, setFormSymptoms] = useState([]);
    const [formTestName, setFormTestName] = useState("");
    const [formTestResult, setFormTestResult] = useState("");
    const [formTests, setFormTests] = useState([]);
    const [formVitals, setFormVitals] = useState({ weight: "", bloodPressure: "", heartRate: "", temperature: "" });
    
    // Prescription Form
    const [formPrescriptionName, setFormPrescriptionName] = useState("");
    const [formPrescriptionDosage, setFormPrescriptionDosage] = useState("");
    const [formPrescriptionDuration, setFormPrescriptionDuration] = useState("");
    const [formPrescriptions, setFormPrescriptions] = useState([]);

    const [formStatus, setFormStatus] = useState("completed");
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
                    isStaff ? getPatientsApi() : Promise.resolve({ patients: [] })
                ]);
                const allRecords = recordsRes.records || [];
                setRecords(isStaff ? allRecords : allRecords.filter(r => r.patientId?.email === user?.email || r.patient?.email === user?.email));
                setPatientsList(patientsRes.patients || []);

                // Check if we came from Appointments with a patient
                const locationState = location.state || window.history.state?.usr;
                if (locationState?.patientId && isDoctor) {
                    setSelectedPatientId(locationState.patientId);
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
    }, [isStaff, isDoctor, location.state, user?.email]);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
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

    const addTest = () => {
        const tName = formTestName.trim();
        const tResult = formTestResult.trim();
        if (tName) {
            setFormTests([...formTests, { name: tName, result: tResult }]);
            setFormTestName("");
            setFormTestResult("");
        }
    };

    const removeTest = (idx) => {
        setFormTests(formTests.filter((_, i) => i !== idx));
    };

    const addPrescription = () => {
        const pName = formPrescriptionName.trim();
        const pDosage = formPrescriptionDosage.trim();
        const pDuration = formPrescriptionDuration.trim();
        if (pName) {
            setFormPrescriptions([...formPrescriptions, { name: pName, dosage: pDosage, duration: pDuration }]);
            setFormPrescriptionName("");
            setFormPrescriptionDosage("");
            setFormPrescriptionDuration("");
        }
    };

    const removePrescription = (idx) => {
        setFormPrescriptions(formPrescriptions.filter((_, i) => i !== idx));
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
                tests: formTests,
                vitals: formVitals,
                prescriptions: formPrescriptions,
                notes: formNotes.trim(),
                status: formStatus,
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
                setSelectedRecordId(res.record._id || res.record.id);
                setShowForm(false);
                setFormAppointmentId(null);
                setFormDiagnosis("");
                setFormSymptoms([]);
                setFormSymptomInput("");
                setFormTests([]);
                setFormTestName("");
                setFormTestResult("");
                setFormVitals({ weight: "", bloodPressure: "", heartRate: "", temperature: "" });
                setFormPrescriptions([]);
                setFormPrescriptionName("");
                setFormPrescriptionDosage("");
                setFormPrescriptionDuration("");
                setFormStatus("completed");
                setFormNotes("");
            }
        } catch (err) {
            console.error("Error saving medical record:", err);
            alert("Có lỗi xảy ra khi lưu hồ sơ");
        }
    };

    // Data filtering
    const patientRecords = records.filter(r => {
        if (isStaff && r.patientId?._id !== selectedPatientId && r.patientId !== selectedPatientId) return false;
        
        // Filter by month (YYYY-MM)
        if (recordSearchMonth && !r.date.startsWith(recordSearchMonth)) return false;
        
        // Search text (diagnosis, notes)
        if (recordSearchText) {
            const query = recordSearchText.toLowerCase();
            const diagMatch = r.diagnosis?.toLowerCase().includes(query);
            const notesMatch = r.notes?.toLowerCase().includes(query);
            if (!diagMatch && !notesMatch) return false;
        }
        
        return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by newest

    // Filter patients by search query
    const filteredPatients = patientsList.filter((p) => {
        const query = searchQuery.toLowerCase();
        return (
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.email && p.email.toLowerCase().includes(query)) ||
            (p.phoneNumber && p.phoneNumber.includes(query))
        );
    });

    const selectedRecord = records.find(r => (r._id || r.id) === selectedRecordId);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-8 flex flex-col">
            <div className="max-w-7xl w-full mx-auto px-4 flex flex-col h-full">
                {/* Header */}
                <div className="mb-6 flex-shrink-0">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {isStaff ? "Quản lý hồ sơ bệnh nhân" : "Hồ sơ bệnh án của tôi"}
                    </h1>
                    <p className="text-gray-500">
                        {isStaff ? "Quản lý lịch sử khám và kê đơn thuốc cho bệnh nhân" : "Lịch sử khám và kết quả điều trị của bạn"}
                    </p>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-10rem)]">
                    {/* COLUMN 1: Patients List (STAFF ONLY) */}
                    {isStaff && (
                        <div className="lg:col-span-3 h-full max-h-[calc(100vh-10rem)] flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                                <h2 className="font-bold text-gray-800">Danh sách bệnh nhân</h2>
                                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                                    {filteredPatients.length}
                                </span>
                            </div>
                            {/* Search Input */}
                            <div className="p-3 border-b border-gray-100 bg-white flex-shrink-0">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm tên, SĐT, email..."
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {loading && patientsList.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">Đang tải...</div>
                                ) : filteredPatients.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500 text-sm">Không tìm thấy bệnh nhân</div>
                                ) : (
                                    filteredPatients.map((patient) => {
                                        const count = records.filter(r => r.patientId?._id === patient._id || r.patientId === patient._id).length;
                                        const isSelected = selectedPatientId === patient._id;
                                        return (
                                            <div
                                                key={patient._id}
                                                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                                                    isSelected
                                                        ? "bg-blue-50 border border-blue-200"
                                                        : "hover:bg-gray-50 border border-transparent"
                                                }`}
                                                onClick={() => {
                                                    setSelectedPatientId(patient._id);
                                                    setSelectedRecordId(null);
                                                    setShowForm(false);
                                                }}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                                                    {patient.name[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`text-sm font-bold truncate ${isSelected ? "text-blue-700" : "text-gray-800"}`}>
                                                        {patient.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {patient.phoneNumber || patient.email}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isSelected ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-600"}`}>
                                                        {count} hồ sơ
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* COLUMN 2: Records History */}
                    <div className={`${isStaff ? "lg:col-span-4" : "lg:col-span-4"} h-full max-h-[calc(100vh-10rem)] flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden`}>
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                            <h2 className="font-bold text-gray-800">Lịch sử khám</h2>
                            {isDoctor && selectedPatientId && (
                                <button
                                    onClick={() => {
                                        setFormPatientId(selectedPatientId);
                                        setShowForm(true);
                                        setSelectedRecordId(null);
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    + Thêm hồ sơ
                                </button>
                            )}
                        </div>
                        
                        {/* Record Filters */}
                        {(!isStaff || selectedPatientId) && (
                            <div className="p-3 border-b border-gray-100 bg-white flex flex-col gap-2 flex-shrink-0">
                                <input
                                    type="month"
                                    value={recordSearchMonth}
                                    onChange={(e) => setRecordSearchMonth(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={recordSearchText}
                                        onChange={(e) => setRecordSearchText(e.target.value)}
                                        placeholder="Tìm theo chẩn đoán, ghi chú..."
                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto p-4">
                            {isStaff && !selectedPatientId ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-sm">Chọn bệnh nhân để xem lịch sử</p>
                                </div>
                            ) : patientRecords.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 text-sm">Chưa có hồ sơ khám bệnh nào</div>
                            ) : (
                                <div className="relative">
                                    {/* Timeline Line */}
                                    <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-blue-100" />
                                    <div className="space-y-4 relative">
                                        {patientRecords.map((record) => {
                                            const isSelected = selectedRecordId === (record._id || record.id) && !showForm;
                                            return (
                                                <div
                                                    key={record._id || record.id}
                                                    className={`relative pl-10 cursor-pointer transition-all ${
                                                        isSelected ? "opacity-100" : "opacity-60 hover:opacity-100"
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedRecordId(record._id || record.id);
                                                        setShowForm(false);
                                                    }}
                                                >
                                                    {/* Dot */}
                                                    <div
                                                        className={`absolute left-2 top-4 w-3.5 h-3.5 rounded-full border-2 border-white shadow transition-colors ${
                                                            isSelected ? "bg-blue-600 ring-4 ring-blue-100" : "bg-blue-300"
                                                        }`}
                                                    />
                                                    {/* Card */}
                                                    <div
                                                        className={`bg-white rounded-xl p-3.5 transition-all ${
                                                            isSelected
                                                                ? "border-blue-400 shadow-md ring-1 ring-blue-400"
                                                                : "border border-gray-100 hover:border-blue-200"
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <div className="text-xs text-blue-600 font-bold">
                                                                {formatDate(record.date)}
                                                            </div>
                                                            {record.status === "pending_test_results" ? (
                                                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold whitespace-nowrap">Chờ KQ</span>
                                                            ) : (
                                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-semibold whitespace-nowrap">Hoàn thành</span>
                                                            )}
                                                        </div>
                                                        <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">
                                                            {record.diagnosis}
                                                        </h4>
                                                        <p className="text-xs text-gray-500">
                                                            BS: {record.doctorId?.name || record.doctor?.name || "Bác sĩ"}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMN 3: Record Details OR Form */}
                    <div className={`${isStaff ? "lg:col-span-5" : "lg:col-span-8"} h-full max-h-[calc(100vh-10rem)] flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden`}>
                        {showForm ? (
                            // --- FORM ---
                            <>
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                                    <h2 className="font-bold text-gray-800">Tạo hồ sơ bệnh án mới</h2>
                                    <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-red-500 text-sm font-medium">✕ Hủy</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Kết quả khám / Chẩn đoán *</label>
                                        <input
                                            type="text"
                                            value={formDiagnosis}
                                            onChange={e => setFormDiagnosis(e.target.value)}
                                            placeholder="VD: Viêm họng cấp, Tình trạng ổn định..."
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái hồ sơ *</label>
                                        <select
                                            value={formStatus}
                                            onChange={e => setFormStatus(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 text-sm bg-white"
                                        >
                                            <option value="completed">✅ Hoàn thành</option>
                                            <option value="pending_test_results">⏳ Chờ kết quả xét nghiệm</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chỉ số cơ bản (Vitals)</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" placeholder="Cân nặng (kg)"
                                                value={formVitals.weight} onChange={e => setFormVitals({...formVitals, weight: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 text-sm"
                                            />
                                            <input type="text" placeholder="Huyết áp (mmHg)"
                                                value={formVitals.bloodPressure} onChange={e => setFormVitals({...formVitals, bloodPressure: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 text-sm"
                                            />
                                            <input type="text" placeholder="Nhịp tim (bpm)"
                                                value={formVitals.heartRate} onChange={e => setFormVitals({...formVitals, heartRate: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 text-sm"
                                            />
                                            <input type="text" placeholder="Nhiệt độ (°C)"
                                                value={formVitals.temperature} onChange={e => setFormVitals({...formVitals, temperature: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Triệu chứng</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formSymptomInput}
                                                onChange={e => setFormSymptomInput(e.target.value)}
                                                onKeyDown={handleSymptomKeyDown}
                                                placeholder="Nhập triệu chứng, bấm Enter để thêm..."
                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 text-sm"
                                            />
                                            <button
                                                onClick={addSymptom}
                                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors text-sm font-medium"
                                            >
                                                Thêm
                                            </button>
                                        </div>
                                        {formSymptoms.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {formSymptoms.map((s, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                                        {s}
                                                        <button onClick={() => removeSymptom(i)} className="ml-1 text-blue-400 hover:text-red-500">✕</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Kết quả xét nghiệm</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formTestName}
                                                onChange={e => setFormTestName(e.target.value)}
                                                placeholder="Tên xét nghiệm (VD: Xét nghiệm máu)"
                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={formTestResult}
                                                onChange={e => setFormTestResult(e.target.value)}
                                                placeholder="Kết quả"
                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 text-sm"
                                            />
                                            <button
                                                onClick={addTest}
                                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors text-sm font-medium"
                                            >
                                                Thêm
                                            </button>
                                        </div>
                                        {formTests.length > 0 && (
                                            <div className="space-y-2 mt-3">
                                                {formTests.map((t, i) => (
                                                    <div key={i} className="flex justify-between items-center p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm">
                                                        <div>
                                                            <span className="font-semibold text-gray-800">{t.name}</span>: <span className="text-gray-600">{t.result || "Chưa có kết quả"}</span>
                                                        </div>
                                                        <button onClick={() => removeTest(i)} className="text-red-400 hover:text-red-600 font-medium">✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Đơn thuốc</label>
                                        <div className="flex flex-col gap-2">
                                            <input type="text" value={formPrescriptionName} onChange={e => setFormPrescriptionName(e.target.value)} placeholder="Tên thuốc (VD: Paracetamol 500mg)" className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 text-sm" />
                                            <div className="flex gap-2">
                                                <input type="text" value={formPrescriptionDosage} onChange={e => setFormPrescriptionDosage(e.target.value)} placeholder="Liều lượng (VD: Sáng 1, Tối 1)" className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 text-sm" />
                                                <input type="text" value={formPrescriptionDuration} onChange={e => setFormPrescriptionDuration(e.target.value)} placeholder="Thời gian (VD: 5 ngày)" className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 text-sm" />
                                                <button onClick={addPrescription} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 text-sm font-medium">Thêm</button>
                                            </div>
                                        </div>
                                        {formPrescriptions.length > 0 && (
                                            <div className="space-y-2 mt-3">
                                                {formPrescriptions.map((p, i) => (
                                                    <div key={i} className="flex justify-between items-center p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm">
                                                        <div>
                                                            <p className="font-bold text-indigo-900">{p.name}</p>
                                                            <p className="text-indigo-700 mt-1">{p.dosage} - {p.duration}</p>
                                                        </div>
                                                        <button onClick={() => removePrescription(i)} className="text-red-400 hover:text-red-600 font-medium text-lg">✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú cho bệnh nhân</label>
                                        <textarea
                                            value={formNotes}
                                            onChange={e => setFormNotes(e.target.value)}
                                            placeholder="Ghi chú thêm..."
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-100 flex justify-end flex-shrink-0">
                                    <button
                                        onClick={handleSaveRecord}
                                        disabled={!formDiagnosis.trim()}
                                        className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-colors ${
                                            formDiagnosis.trim() ? "bg-emerald-500 hover:bg-emerald-600 shadow-md" : "bg-gray-300 cursor-not-allowed"
                                        }`}
                                    >
                                        ✅ Lưu hồ sơ
                                    </button>
                                </div>
                            </>
                        ) : selectedRecord ? (
                            // --- RECORD DETAILS ---
                            <>
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                                    <h2 className="font-bold text-gray-800">Chi tiết hồ sơ</h2>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                    {/* Info Header */}
                                    <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div>
                                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Ngày khám</p>
                                            <p className="font-bold text-gray-800">{formatDate(selectedRecord.date)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Bác sĩ phụ trách</p>
                                            <p className="font-bold text-gray-800">{selectedRecord.doctorId?.name || selectedRecord.doctor?.name || "Bác sĩ"}</p>
                                        </div>
                                    </div>

                                    {/* Status Info */}
                                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                                        selectedRecord.status === "pending_test_results" 
                                        ? "bg-amber-50 border-amber-200 text-amber-800"
                                        : "bg-emerald-50 border-emerald-200 text-emerald-800"
                                    }`}>
                                        <div className="text-xl">
                                            {selectedRecord.status === "pending_test_results" ? "⏳" : "✅"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">
                                                {selectedRecord.status === "pending_test_results" ? "Đang chờ kết quả xét nghiệm" : "Hồ sơ đã hoàn thành"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Vitals */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <span className="text-lg">📊</span> Chỉ số cơ bản
                                        </p>
                                        {(selectedRecord.vitals?.weight || selectedRecord.vitals?.bloodPressure || selectedRecord.vitals?.heartRate || selectedRecord.vitals?.temperature) ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div className="p-3 bg-white border border-gray-200 rounded-xl text-center shadow-sm">
                                                    <p className="text-gray-500 text-xs mb-1">⚖️ Cân nặng</p>
                                                    <p className="font-bold text-gray-800">{selectedRecord.vitals.weight || "--"} kg</p>
                                                </div>
                                                <div className="p-3 bg-white border border-gray-200 rounded-xl text-center shadow-sm">
                                                    <p className="text-gray-500 text-xs mb-1">🩸 Huyết áp</p>
                                                    <p className="font-bold text-gray-800">{selectedRecord.vitals.bloodPressure || "--"}</p>
                                                </div>
                                                <div className="p-3 bg-white border border-gray-200 rounded-xl text-center shadow-sm">
                                                    <p className="text-gray-500 text-xs mb-1">❤️ Nhịp tim</p>
                                                    <p className="font-bold text-gray-800">{selectedRecord.vitals.heartRate || "--"} bpm</p>
                                                </div>
                                                <div className="p-3 bg-white border border-gray-200 rounded-xl text-center shadow-sm">
                                                    <p className="text-gray-500 text-xs mb-1">🌡️ Nhiệt độ</p>
                                                    <p className="font-bold text-gray-800">{selectedRecord.vitals.temperature || "--"} °C</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-xl border border-gray-100">Chưa ghi nhận chỉ số cơ bản</p>
                                        )}
                                    </div>

                                    {/* Diagnosis */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <span className="text-lg">🩺</span> Kết quả khám / Chẩn đoán
                                        </p>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-800 font-medium">
                                            {selectedRecord.diagnosis}
                                        </div>
                                    </div>

                                    {/* Symptoms */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <span className="text-lg">📋</span> Triệu chứng
                                        </p>
                                        {(selectedRecord.symptoms?.length > 0) ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedRecord.symptoms.map((s, i) => (
                                                    <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-full text-sm font-medium">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-xl border border-gray-100">Không có triệu chứng được ghi nhận</p>
                                        )}
                                    </div>

                                    {/* Prescriptions */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <span className="text-lg">💊</span> Đơn thuốc
                                        </p>
                                        {(selectedRecord.prescriptions?.length > 0) ? (
                                            <>
                                                <div className="space-y-2 mb-3">
                                                    {selectedRecord.prescriptions.map((med, i) => (
                                                        <div key={i} className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                                                            <div>
                                                                <p className="font-bold text-gray-800">{med.name}</p>
                                                                <p className="text-xs text-gray-500 mt-1">{med.dosage}</p>
                                                            </div>
                                                            <span className="text-xs font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-md border border-indigo-200">
                                                                {med.duration}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-xl border border-gray-100 mb-3">Không kê đơn thuốc mới trong hồ sơ này</p>
                                        )}
                                        {!isDoctor && (
                                            <div className="text-right">
                                                <button
                                                    onClick={() => navigate("/prescriptions", {
                                                        state: {
                                                            medicalRecordId: selectedRecord._id || selectedRecord.id,
                                                            patientId: selectedRecord.patientId?._id || selectedRecord.patientId,
                                                            patientName: selectedRecord.patientId?.name || selectedRecord.patient?.name || "Bệnh nhân"
                                                        }
                                                    })}
                                                    className="text-sm text-blue-600 border border-blue-600 px-4 py-1.5 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                                                >
                                                    {isStaff ? "Quản lý đơn thuốc →" : "Xem đơn thuốc →"}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tests */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <span className="text-lg">🔬</span> Kết quả xét nghiệm
                                        </p>
                                        {(selectedRecord.tests?.length > 0) ? (
                                            <div className="space-y-2">
                                                {selectedRecord.tests.map((test, i) => (
                                                    <div key={i} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-gray-800">{test.name}</p>
                                                            <p className="text-xs text-gray-500 mt-1">{test.result}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-xl border border-gray-100">Không có xét nghiệm</p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <span className="text-lg">📝</span> Lời dặn của bác sĩ
                                        </p>
                                        {selectedRecord.notes ? (
                                            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200 text-sm leading-relaxed">
                                                {selectedRecord.notes}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-xl border border-gray-100">Không có lời dặn</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            // --- EMPTY STATE ---
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-600 mb-1">Chưa chọn hồ sơ</h3>
                                <p className="text-sm">Chọn một hồ sơ từ lịch sử khám để xem chi tiết</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
