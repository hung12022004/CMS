import { useState, useEffect, useRef } from "react";
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

// Mock data cho danh sách thuốc (Cửa sổ gợi ý)
const MEDICINE_LIST = [
    "Amoxicillin 500mg",
    "Paracetamol 500mg",
    "Ibuprofen 400mg",
    "Loratadine 10mg",
    "Omeprazole 20mg",
    "Amlodipine 5mg",
    "Metformin 20mg",
    "Cetirizine 10mg",
    "Vitamin C 500mg",
    "Azithromycin 500mg",
    "Cefuroxime 500mg",
    "Pantoprazole 40mg",
    "Domperidone 40mg",
    "Salbutamol 2mg",
    "Prednisolone 5mg"
];

export default function MedicalRecordsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    // Layout & View State
    const [viewMode, setViewMode] = useState("list"); // 'list' or 'detail' (mostly used for mobile/fallback)
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [activeAccordion, setActiveAccordion] = useState({});

    // Data State
    const [records, setRecords] = useState([]);
    const [patientsList, setPatientsList] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [selectedRecordId, setSelectedRecordId] = useState(null);

    const patientRefs = useRef({});

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [historySearch, setHistorySearch] = useState("");
    const [filterDate, setFilterDate] = useState("");

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formPatientId, setFormPatientId] = useState("");
    const [formAppointmentId, setFormAppointmentId] = useState(null);
    const [formDiagnosis, setFormDiagnosis] = useState("");
    const [formStatus, setFormStatus] = useState("Hoàn thành");
    const [formVitals, setFormVitals] = useState({
        weight: "",
        height: "",
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        breathingRate: ""
    });
    
    const [formSymptomInput, setFormSymptomInput] = useState("");
    const [formSymptoms, setFormSymptoms] = useState([]);
    const [formReason, setFormReason] = useState("");
    const [formMedicalHistory, setFormMedicalHistory] = useState("");
    const [formPersonalHistory, setFormPersonalHistory] = useState("");
    const [formFamilyHistory, setFormFamilyHistory] = useState("");
    const [formClinicalExam, setFormClinicalExam] = useState("");
    const [formLabTests, setFormLabTests] = useState("");
    const [formFollowUpDate, setFormFollowUpDate] = useState("");
    const [formNotes, setFormNotes] = useState("");
    const [formPrescriptionInput, setFormPrescriptionInput] = useState({ 
        name: "", 
        morning: 0, 
        noon: 0, 
        evening: 0, 
        duration: 7, 
        instructions: "Uống sau ăn" 
    });
    const [formPrescriptions, setFormPrescriptions] = useState([]);
    const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);

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
                const locationState = window.history.state?.usr;
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
    }, [isDoctor, isStaff, user?.email]);

    useEffect(() => {
        // Reset selected record when patient changes
        setSelectedRecordId(null);
        setShowForm(false);
        
        // Scroll to selected patient in the sidebar
        if (selectedPatientId && patientRefs.current[selectedPatientId]) {
            patientRefs.current[selectedPatientId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedPatientId]);

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

    // Patient Filtering
    const filteredPatients = patientsList.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phoneNumber && p.phoneNumber.includes(searchTerm))
    );

    const selectedPatient = patientsList.find(p => p._id === selectedPatientId);

    // History Filtering
    const patientRecords = records.filter(r =>
        (r.patientId?._id === selectedPatientId || r.patientId === selectedPatientId) &&
        (r.diagnosis.toLowerCase().includes(historySearch.toLowerCase()) || r.notes.toLowerCase().includes(historySearch.toLowerCase())) &&
        (!filterDate || r.date === filterDate)
    );

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

    const addPrescription = () => {
        if (formPrescriptionInput.name.trim()) {
            const parts = [];
            if (formPrescriptionInput.morning > 0) parts.push(`Sáng ${formPrescriptionInput.morning}`);
            if (formPrescriptionInput.noon > 0) parts.push(`Trưa ${formPrescriptionInput.noon}`);
            if (formPrescriptionInput.evening > 0) parts.push(`Tối ${formPrescriptionInput.evening}`);
            
            const dosageStr = parts.length > 0 ? parts.join(", ") + " viên" : "Theo chỉ dẫn";
            const durationStr = `${formPrescriptionInput.duration} ngày`;

            setFormPrescriptions([...formPrescriptions, { 
                name: formPrescriptionInput.name, dosage: dosageStr, duration: durationStr, instructions: formPrescriptionInput.instructions 
            }]);
            setFormPrescriptionInput({ name: "", morning: 0, noon: 0, evening: 0, duration: 7, instructions: "Uống sau ăn" });
        }
    };

    const removePrescription = (idx) => {
        setFormPrescriptions(formPrescriptions.filter((_, i) => i !== idx));
    };

    const handleSaveRecord = async () => {
        const targetPatientId = formPatientId || selectedPatientId;
        if (!targetPatientId || !formDiagnosis.trim()) return;

        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        try {
            const res = await createMedicalRecordApi({
                patientId: targetPatientId,
                diagnosis: formDiagnosis.trim(),
                symptoms: formSymptoms,
                reason: formReason.trim(),
                medicalHistory: formMedicalHistory.trim(),
                personalHistory: formPersonalHistory.trim(),
                familyHistory: formFamilyHistory.trim(),
                clinicalExam: formClinicalExam.trim(),
                labTests: formLabTests.trim(),
                followUpDate: formFollowUpDate,
                notes: formNotes.trim(),
                date: dateStr,
                vitals: formVitals,
                status: formStatus,
                prescriptions: formPrescriptions
            });

            if (res.record) {
                if (formAppointmentId) {
                    try {
                        await updateAppointmentStatusApi(formAppointmentId, "completed");
                    } catch (err) {
                        console.error("Failed to complete appointment automatically:", err);
                    }
                }

                const recordsRes = await getMedicalRecordsApi();
                const updatedRecords = recordsRes.records || [];
                setRecords(updatedRecords);

                // Auto-select the new record to show in Column 3
                const newRecord = updatedRecords.find(r => r.diagnosis === formDiagnosis.trim() && r.patientId?._id === targetPatientId);
                if (newRecord) {
                    setSelectedRecordId(newRecord._id);
                }

                // Reset form
                setFormDiagnosis("");
                setFormSymptoms([]);
                setFormSymptomInput("");
                setFormReason("");
                setFormMedicalHistory("");
                setFormPersonalHistory("");
                setFormFamilyHistory("");
                setFormClinicalExam("");
                setFormLabTests("");
                setFormFollowUpDate("");
                setFormNotes("");
                setFormVitals({ weight: "", height: "", bloodPressure: "", heartRate: "", temperature: "", breathingRate: "" });
                setFormPrescriptionInput({ 
                    name: "", 
                    morning: 0, 
                    noon: 0, 
                    evening: 0, 
                    duration: 7, 
                    instructions: "Uống sau ăn" 
                });
                setFormPrescriptions([]);
                setShowForm(false);
            }
        } catch (err) {
            console.error("Error saving medical record:", err);
            alert("Có lỗi xảy ra khi lưu hồ sơ");
        }
    };

    // Render for Patient view
    if (!isDoctor) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20 pb-8">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Hồ sơ bệnh án</h1>
                        <p className="text-gray-500">Lịch sử khám và kết quả điều trị của bạn</p>
                    </div>

                    <div className="relative">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200" />
                        <div className="space-y-6">
                            {records.length > 0 ? (
                                records.map((record, index) => (
                                    <div key={record._id} className="relative pl-16 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <div className="absolute left-4 top-6 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow" />
                                        <div className="bg-white rounded-2xl shadow-lg p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="text-sm text-[#1E293B] font-semibold">{formatDate(record.date)}</span>
                                                    <h3 className="font-bold text-gray-800 text-lg mt-1">{record.diagnosis}</h3>
                                                </div>
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase">
                                                    {record.status || "Hoàn thành"}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-4">{record.notes}</p>
                                            
                                            {record.prescriptions && record.prescriptions.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                                        💊 Đơn thuốc:
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {record.prescriptions.map((p, i) => (
                                                            <div key={i} className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg flex justify-between items-center">
                                                                <div>
                                                                    <span className="font-bold text-blue-600">{p.name}</span>
                                                                    <span className="mx-2">•</span>
                                                                    <span>{p.dosage}</span>
                                                                </div>
                                                                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">{p.duration}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
                                    <p className="text-gray-500 italic">Chưa có hồ sơ bệnh án nào.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Doctor Layout (3 Columns)
    return (
        <div className="h-screen bg-[#F0F4F8] pt-16 flex overflow-hidden">
            {/* Sidebar: Patient List */}
            <div className="w-[320px] bg-white border-r flex flex-col shadow-sm">
                <div className="p-5 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-[#1E293B]">Danh sách bệnh nhân</h2>
                        <span className="w-7 h-7 bg-[#E2E8F0] text-[#475569] text-xs font-bold rounded-full flex items-center justify-center">
                            {patientsList.length}
                        </span>
                    </div>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Tìm tên, SĐT, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                        <svg className="absolute left-3.5 top-3 w-4 h-4 text-[#94A3B8] group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredPatients.map(patient => {
                        const count = records.filter(r => r.patientId?._id === patient._id || r.patientId === patient._id).length;
                        const isSelected = selectedPatientId === patient._id;
                        return (
                            <div
                                key={patient._id}
                                ref={el => patientRefs.current[patient._id] = el}
                                onClick={() => {
                                    setSelectedPatientId(patient._id);
                                    setFormPatientId(patient._id);
                                }}
                                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${isSelected ? "bg-[#EFF6FF] border border-blue-100" : "hover:bg-gray-50 border border-transparent"
                                    }`}
                            >
                                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                                    {patient.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-[#1E293B] truncate">{patient.name}</h3>
                                    <p className="text-[11px] text-[#64748B] truncate">{patient.email}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="px-2 py-0.5 bg-[#E0E7FF] text-[#4338CA] text-[10px] font-bold rounded-full">
                                        {count} hồ sơ
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Middle: History Timeline */}
            <div className="flex-1 bg-white border-r flex flex-col shadow-sm">
                <div className="p-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-[#1E293B]">Lịch sử khám</h2>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        + Thêm hồ sơ
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none"
                            />
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo chẩn đoán, ghi chú..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-5 relative">
                    {selectedPatientId ? (
                        <>
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-100" />
                            <div className="space-y-8">
                                {patientRecords.map((record, idx) => (
                                    <div key={record._id} className="relative pl-10">
                                        <div className="absolute left-[-4px] top-6 w-3 h-3 bg-blue-400 rounded-full ring-4 ring-white shadow-sm" />
                                        <div 
                                            onClick={() => {
                                                setSelectedRecordId(record._id);
                                                setShowForm(false);
                                            }}
                                            className={`border rounded-2xl p-5 cursor-pointer transition-all ${
                                                selectedRecordId === record._id 
                                                ? "bg-blue-50 border-blue-200 shadow-md scale-[1.02]" 
                                                : "bg-[#F8FAFC] border-[#EDF2F7] hover:shadow-md"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-[#1E293B]">{formatDate(record.date)}</span>
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md uppercase border border-emerald-100">
                                                    {record.status || "Hoàn thành"}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-[#334155] text-base mb-1">{record.diagnosis}</h3>
                                            <p className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                                                BS: {record.doctorId?.name || "BS. Nguyễn Văn A"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {patientRecords.length === 0 && (
                                    <div className="text-center py-10 opacity-50">
                                        <p className="text-sm">Bệnh nhân chưa có lịch sử khám.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] pb-10">
                            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p className="font-medium">Chọn một bệnh nhân để xem lịch sử khám</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Record Detail OR Form */}
            <div className={`w-[450px] bg-white border-l transition-all duration-300 flex flex-col shadow-xl ${(showForm || selectedRecordId) ? "mr-0" : "-mr-[450px]"}`}>
                {showForm ? (
                    <>
                        <div className="p-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-[#1E293B]">Tạo hồ sơ bệnh án mới</h2>
                            <button onClick={() => setShowForm(false)} className="text-[#94A3B8] hover:text-[#475569] text-sm flex items-center gap-1">
                                ✕ Hủy
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* 1. Hành chính */}
                            <div>
                                <h3 className="text-[13px] font-bold text-blue-800 uppercase border-b-2 border-blue-100 pb-2 mb-3">1. Hành chính</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Trạng thái hồ sơ *</label>
                                        <select
                                            value={formStatus}
                                            onChange={e => setFormStatus(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-blue-400"
                                        >
                                            <option value="Hoàn thành">✅ Hoàn thành</option>
                                            <option value="Đang điều trị">🏥 Đang điều trị</option>
                                            <option value="Chờ kết quả">⏳ Chờ kết quả</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Bệnh nhân</label>
                                        <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium truncate">
                                            {selectedPatient?.name || "Chưa chọn bệnh nhân"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Hỏi bệnh */}
                            <div>
                                <h3 className="text-[13px] font-bold text-blue-800 uppercase border-b-2 border-blue-100 pb-2 mb-3">2. Hỏi bệnh</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Lý do đến khám</label>
                                        <input
                                            type="text"
                                            value={formReason}
                                            onChange={e => setFormReason(e.target.value)}
                                            placeholder="VD: Đau bụng 2 ngày, sốt cao..."
                                            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Triệu chứng (Tags)</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={formSymptomInput}
                                                onChange={e => setFormSymptomInput(e.target.value)}
                                                onKeyDown={handleSymptomKeyDown}
                                                placeholder="Thêm triệu chứng rời rạc..."
                                                className="flex-1 px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            />
                                            <button type="button" onClick={addSymptom} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-200 transition-colors">Thêm</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formSymptoms.map((s, i) => (
                                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                                    {s}
                                                    <button type="button" onClick={() => removeSymptom(i)} className="hover:text-red-500 transition-colors">✕</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Bệnh sử</label>
                                        <textarea
                                            value={formMedicalHistory}
                                            onChange={e => setFormMedicalHistory(e.target.value)}
                                            placeholder="Diễn biến bệnh chi tiết (khởi phát, triệu chứng, đã điều trị gì chưa)..."
                                            rows={2}
                                            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-blue-400 resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tiền sử bản thân</label>
                                            <textarea
                                                value={formPersonalHistory}
                                                onChange={e => setFormPersonalHistory(e.target.value)}
                                                placeholder="Dị ứng thuốc, bệnh mãn tính..."
                                                rows={2}
                                                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-blue-400 resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tiền sử gia đình</label>
                                            <textarea
                                                value={formFamilyHistory}
                                                onChange={e => setFormFamilyHistory(e.target.value)}
                                                placeholder="Các bệnh lý liên quan..."
                                                rows={2}
                                                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-blue-400 resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Khám lâm sàng */}
                            <div>
                                <h3 className="text-[13px] font-bold text-blue-800 uppercase border-b-2 border-blue-100 pb-2 mb-3">3. Khám lâm sàng</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-3">Dấu hiệu sinh tồn</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            <input type="text" placeholder="Mạch (l/p)" value={formVitals.heartRate} onChange={e => setFormVitals({ ...formVitals, heartRate: e.target.value })} className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] text-center focus:outline-none focus:border-blue-400" />
                                            <input type="text" placeholder="Huyết áp (mmHg)" value={formVitals.bloodPressure} onChange={e => setFormVitals({ ...formVitals, bloodPressure: e.target.value })} className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] text-center focus:outline-none focus:border-blue-400" />
                                            <input type="text" placeholder="Nhiệt độ (°C)" value={formVitals.temperature} onChange={e => setFormVitals({ ...formVitals, temperature: e.target.value })} className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] text-center focus:outline-none focus:border-blue-400" />
                                            <input type="text" placeholder="Nhịp thở (l/p)" value={formVitals.breathingRate} onChange={e => setFormVitals({ ...formVitals, breathingRate: e.target.value })} className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] text-center focus:outline-none focus:border-blue-400" />
                                            <input type="text" placeholder="Cân nặng (kg)" value={formVitals.weight} onChange={e => setFormVitals({ ...formVitals, weight: e.target.value })} className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] text-center focus:outline-none focus:border-blue-400" />
                                            <input type="text" placeholder="Chiều cao (cm)" value={formVitals.height} onChange={e => setFormVitals({ ...formVitals, height: e.target.value })} className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] text-center focus:outline-none focus:border-blue-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Khám các cơ quan</label>
                                        <textarea
                                            value={formClinicalExam}
                                            onChange={e => setFormClinicalExam(e.target.value)}
                                            placeholder="Ghi nhận tình trạng hiện tại (tim, phổi, bụng, da...)"
                                            rows={3}
                                            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-blue-400 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 4. Cận lâm sàng & Chẩn đoán */}
                            <div>
                                <h3 className="text-[13px] font-bold text-blue-800 uppercase border-b-2 border-blue-100 pb-2 mb-3">4. Cận lâm sàng & Chẩn đoán</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Chỉ định cận lâm sàng</label>
                                        <textarea
                                            value={formLabTests}
                                            onChange={e => setFormLabTests(e.target.value)}
                                            placeholder="Xét nghiệm máu, X-quang, Siêu âm (nếu có)..."
                                            rows={2}
                                            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-blue-400 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Chẩn đoán xác định *</label>
                                        <input
                                            type="text"
                                            value={formDiagnosis}
                                            onChange={e => setFormDiagnosis(e.target.value)}
                                            placeholder="VD: Viêm họng cấp, Tăng huyết áp..."
                                            className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 5. Xử trí & Điều trị */}
                            <div>
                                <h3 className="text-[13px] font-bold text-blue-800 uppercase border-b-2 border-blue-100 pb-2 mb-3">5. Xử trí & Điều trị</h3>
                                <div className="space-y-4">
                                    {/* Prescriptions */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Đơn thuốc</label>
                                        <div className="space-y-3 mb-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                                            <div className="relative">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Tên thuốc</label>
                                                <input
                                                    type="text"
                                                    placeholder="Chọn hoặc nhập tên thuốc..."
                                                    value={formPrescriptionInput.name}
                                                    onFocus={() => setShowMedicineDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowMedicineDropdown(false), 200)}
                                                    onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, name: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:border-blue-400"
                                                />
                                                {showMedicineDropdown && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                        {MEDICINE_LIST.filter(med => med.toLowerCase().includes(formPrescriptionInput.name.toLowerCase())).length > 0 ? (
                                                            MEDICINE_LIST.filter(med => med.toLowerCase().includes(formPrescriptionInput.name.toLowerCase())).map((med, idx) => (
                                                                <div 
                                                                    key={idx} 
                                                                    className="px-4 py-2.5 text-sm text-[#1E293B] hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                                                    onClick={() => {
                                                                        setFormPrescriptionInput({ ...formPrescriptionInput, name: med });
                                                                        setShowMedicineDropdown(false);
                                                                    }}
                                                                >
                                                                    {med}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-3 text-sm text-gray-400 italic">Không tìm thấy gợi ý</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Sáng</label>
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1.5 text-sm">🌅</span>
                                                        <input type="number" min="0" value={formPrescriptionInput.morning} onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, morning: Number(e.target.value) || 0 })} className="w-full pl-8 pr-2 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:border-blue-400" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Trưa</label>
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1.5 text-sm">☀️</span>
                                                        <input type="number" min="0" value={formPrescriptionInput.noon} onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, noon: Number(e.target.value) || 0 })} className="w-full pl-8 pr-2 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:border-blue-400" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Tối</label>
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1.5 text-sm">🌙</span>
                                                        <input type="number" min="0" value={formPrescriptionInput.evening} onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, evening: Number(e.target.value) || 0 })} className="w-full pl-8 pr-2 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:border-blue-400" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Thời gian dùng</label>
                                                    <div className="relative">
                                                        <input type="number" min="1" value={formPrescriptionInput.duration} onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, duration: Number(e.target.value) || 1 })} className="w-full pl-3 pr-10 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:border-blue-400" />
                                                        <span className="absolute right-3 top-2 text-xs text-gray-400 font-medium">ngày</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Cách dùng</label>
                                                    <select value={formPrescriptionInput.instructions} onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, instructions: e.target.value })} className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#1E293B] focus:outline-none focus:border-blue-400">
                                                        <option value="Uống sau ăn">Uống sau ăn</option>
                                                        <option value="Uống trước ăn">Uống trước ăn</option>
                                                        <option value="Uống khi no">Uống khi no</option>
                                                        <option value="Ngậm dưới lưỡi">Ngậm dưới lưỡi</option>
                                                        <option value="Bôi ngoài da">Bôi ngoài da</option>
                                                        <option value="Theo chỉ dẫn của BS">Theo chỉ dẫn của BS</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button
                                                onClick={addPrescription}
                                                type="button"
                                                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors mt-2"
                                            >
                                                + Thêm thuốc vào đơn
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {formPrescriptions.map((p, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-xl shadow-sm hover:border-blue-300 transition-colors">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-800">{p.name}</p>
                                                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                            <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{p.dosage}</span>
                                                            <span className="text-[11px] text-gray-500">• {p.duration}</span>
                                                            <span className="text-[11px] text-gray-500">• {p.instructions}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removePrescription(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                            {formPrescriptions.length === 0 && (
                                                <p className="text-xs text-gray-400 italic text-center py-2">Đơn thuốc trống</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Lời dặn của bác sĩ</label>
                                        <textarea
                                            value={formNotes}
                                            onChange={e => setFormNotes(e.target.value)}
                                            placeholder="Chế độ ăn uống, sinh hoạt, nghỉ ngơi..."
                                            rows={2}
                                            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-blue-400 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Hẹn tái khám</label>
                                        <input
                                            type="date"
                                            value={formFollowUpDate}
                                            onChange={e => setFormFollowUpDate(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-blue-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t bg-gray-50">
                            <button
                                onClick={handleSaveRecord}
                                disabled={!selectedPatientId || !formDiagnosis.trim()}
                                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${selectedPatientId && formDiagnosis.trim() ? "bg-emerald-500 hover:bg-emerald-600" : "bg-gray-300 cursor-not-allowed shadow-none"
                                    }`}
                            >
                                ✅ Lưu hồ sơ bệnh án
                            </button>
                        </div>
                    </>
                ) : selectedRecordId ? (
                    (() => {
                        const record = records.find(r => r._id === selectedRecordId);
                        if (!record) return null;
                        return (
                            <>
                                <div className="p-5 border-b flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
                                    <div>
                                        <h2 className="text-xl font-bold text-[#1E293B]">Chi tiết hồ sơ</h2>
                                        <p className="text-xs text-[#64748B] mt-1">{formatDate(record.date)}</p>
                                    </div>
                                    <button onClick={() => setSelectedRecordId(null)} className="text-[#94A3B8] hover:text-[#475569]">
                                        ✕ Đóng
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {/* 1. Hành chính */}
                                    <div>
                                        <h3 className="text-[13px] font-bold text-blue-800 uppercase border-b-2 border-blue-100 pb-2 mb-3">1. Hành chính</h3>
                                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                                            <p><span className="text-gray-500">Họ và tên:</span> <span className="font-bold text-gray-800 ml-1">{record.patientId?.name || selectedPatient?.name || "—"}</span></p>
                                            <p><span className="text-gray-500">Tuổi:</span> <span className="font-medium ml-1">{record.patientId?.age || selectedPatient?.age || "—"}</span></p>
                                            <p><span className="text-gray-500">Giới tính:</span> <span className="font-medium ml-1">{record.patientId?.gender === 'male' ? 'Nam' : record.patientId?.gender === 'female' ? 'Nữ' : record.patientId?.gender || selectedPatient?.gender || "—"}</span></p>
                                            <p><span className="text-gray-500">SĐT:</span> <span className="font-medium ml-1">{record.patientId?.phoneNumber || selectedPatient?.phoneNumber || "—"}</span></p>
                                            <p className="col-span-2"><span className="text-gray-500">Địa chỉ:</span> <span className="font-medium ml-1">{record.patientId?.address || selectedPatient?.address || "—"}</span></p>
                                            <p className="col-span-2"><span className="text-gray-500">Ngày khám:</span> <span className="font-medium ml-1">{formatDate(record.date)}</span></p>
                                        </div>
                                    </div>

                                    {/* 2. Hỏi bệnh */}
                                    <div>
                                        <h3 className="text-[13px] font-bold text-blue-800 uppercase border-b-2 border-blue-100 pb-2 mb-3">2. Hỏi bệnh</h3>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <span className="text-gray-500 font-semibold block mb-1">Lý do đến khám:</span>
                                                <p className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg text-gray-800">{record.reason || (record.symptoms && record.symptoms.length > 0 ? record.symptoms.join(', ') : 'Không ghi nhận')}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 font-semibold block mb-1">Bệnh sử:</span>
                                                <p className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg text-gray-800">{record.medicalHistory || 'Không ghi nhận'}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 font-semibold block mb-1">Tiền sử:</span>
                                                <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg space-y-1.5 text-gray-800">
                                                    <p><span className="font-medium text-gray-600">Bản thân:</span> {record.personalHistory || 'Không ghi nhận bất thường'}</p>
                                                    <p><span className="font-medium text-gray-600">Gia đình:</span> {record.familyHistory || 'Không ghi nhận bất thường'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Khám lâm sàng */}
                                    <div>
                                        <h3 className="text-[13px] font-bold text-blue-800 uppercase border-b-2 border-blue-100 pb-2 mb-3">3. Khám lâm sàng</h3>
                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <span className="text-gray-500 font-semibold block mb-2">Dấu hiệu sinh tồn:</span>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-blue-50/50 border border-blue-100 p-2 rounded-xl text-center"><p className="text-[11px] text-gray-800 font-bold uppercase mb-0.5">Mạch</p><p className="font-bold text-gray-800">{record.vitals?.heartRate || '--'} <span className="font-normal text-[10px] text-gray-500">l/p</span></p></div>
                                                    <div className="bg-red-50/50 border border-red-100 p-2 rounded-xl text-center"><p className="text-[11px] text-gray-800 font-bold uppercase mb-0.5">Huyết áp</p><p className="font-bold text-gray-800">{record.vitals?.bloodPressure || '--'} <span className="font-normal text-[10px] text-gray-500">mmHg</span></p></div>
                                                    <div className="bg-orange-50/50 border border-orange-100 p-2 rounded-xl text-center"><p className="text-[11px] text-gray-800 font-bold uppercase mb-0.5">Nhiệt độ</p><p className="font-bold text-gray-800">{record.vitals?.temperature || '--'} <span className="font-normal text-[10px] text-gray-500">°C</span></p></div>
                                                    <div className="bg-cyan-50/50 border border-cyan-100 p-2 rounded-xl text-center"><p className="text-[11px] text-gray-800 font-bold uppercase mb-0.5">Nhịp thở</p><p className="font-bold text-gray-800">{record.vitals?.breathingRate || '--'} <span className="font-normal text-[10px] text-gray-500">l/p</span></p></div>
                                                    <div className="bg-emerald-50/50 border border-emerald-100 p-2 rounded-xl text-center"><p className="text-[11px] text-gray-800 font-bold uppercase mb-0.5">Cân nặng</p><p className="font-bold text-gray-800">{record.vitals?.weight || '--'} <span className="font-normal text-[10px] text-gray-500">kg</span></p></div>
                                                    <div className="bg-purple-50/50 border border-purple-100 p-2 rounded-xl text-center"><p className="text-[11px] text-gray-800 font-bold uppercase mb-0.5">Chiều cao</p><p className="font-bold text-gray-800">{record.vitals?.height || '--'} <span className="font-normal text-[10px] text-gray-500">cm</span></p></div>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 font-semibold block mb-1">Khám các cơ quan:</span>
                                                <p className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg text-gray-800">{record.clinicalExam || 'Chưa ghi nhận bất thường'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Cận lâm sàng & Chẩn đoán */}
                                    <div>
                                        <h3 className="text-[13px] font-bold text-blue-800 uppercase border-b-2 border-blue-100 pb-2 mb-3">4. Cận lâm sàng & Chẩn đoán</h3>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <span className="text-gray-500 font-semibold block mb-1">Chỉ định cận lâm sàng:</span>
                                                <p className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg text-gray-800">{record.labTests || 'Không có chỉ định'}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 font-semibold block mb-1">Chẩn đoán xác định:</span>
                                                <p className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-lg font-bold text-base shadow-sm">{record.diagnosis}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. Xử trí & Điều trị */}
                                    <div>
                                        <h3 className="text-[13px] font-bold text-blue-800 uppercase border-b-2 border-blue-100 pb-2 mb-3">5. Xử trí & Điều trị</h3>
                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <span className="text-gray-500 font-semibold block mb-2">Đơn thuốc:</span>
                                                {record.prescriptions && record.prescriptions.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {record.prescriptions.map((p, i) => (
                                                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                                                                <p className="font-bold text-gray-800 text-sm">{i + 1}. {p.name}</p>
                                                                <div className="grid grid-cols-2 gap-2 mt-2 ml-4">
                                                                    <p className="text-gray-600 text-xs">- Cấp: <span className="font-semibold text-gray-800">{p.duration}</span></p>
                                                                    <p className="text-gray-600 text-xs">- Liều: <span className="font-semibold text-gray-800">{p.dosage}</span></p>
                                                                    <p className="text-gray-600 text-xs col-span-2">- HD: <span className="font-medium text-gray-800">{p.instructions || 'Theo chỉ dẫn'}</span></p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg italic text-gray-500">Không có chỉ định dùng thuốc</p>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-gray-500 font-semibold block mb-1">Lời dặn của bác sĩ:</span>
                                                <p className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg text-gray-800">{record.notes || 'Không có hướng dẫn thêm'}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 font-semibold block mb-1">Hẹn tái khám:</span>
                                                <p className="bg-amber-50 border border-amber-100 text-amber-800 p-2.5 rounded-lg font-medium">
                                                    {record.followUpDate ? formatDate(record.followUpDate) : 'Khám lại khi có triệu chứng bất thường'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 6. Xác nhận */}
                                    <div className="mt-8 pt-8 border-t border-gray-200 flex justify-end text-center">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-16 italic">
                                                Ngày {new Date(record.date).getDate()} tháng {new Date(record.date).getMonth() + 1} năm {new Date(record.date).getFullYear()}
                                                <br />Bác sĩ khám bệnh
                                            </p>
                                            <p className="font-bold text-gray-800 text-sm">BS. {record.doctorId?.name || "Bác sĩ"}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-50/50">
                            <span className="text-4xl translate-y-1">📁</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#1E293B] mb-2">Chi tiết hồ sơ bệnh án</h3>
                        <p className="text-sm text-[#64748B] max-w-[250px]">
                            Chọn một mốc thời gian từ lịch sử khám để xem thông tin chi tiết và đơn thuốc.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
