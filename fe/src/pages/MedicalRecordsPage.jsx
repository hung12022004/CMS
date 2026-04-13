import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getMedicalRecordsApi, createMedicalRecordApi, updateMedicalRecordApi } from "../services/medicalRecord.api";
import { getPatientsApi } from "../services/user.api";
import { updateAppointmentStatusApi } from "../services/appointment.api";
import { updateQueueStatusApi } from "../services/checkin.api";
import { startEncounterApi, createEncounterServiceApi, getActiveEncounterApi } from "../services/encounter.api";
import { socket, connectSocket, disconnectSocket, joinDoctorRoom } from "../services/socketClient";

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

// Danh sách thuốc, liều dùng và hướng dẫn phổ biến (mô phỏng CSDL)
const COMMON_MEDICINES = [
    "Paracetamol 500mg", "Ibuprofen 400mg", "Amoxicillin 500mg",
    "Azithromycin 500mg", "Loratadine 10mg", "Cetirizine 10mg",
    "Omeprazole 20mg", "Pantoprazole 40mg", "Metformin 500mg",
    "Amlodipine 5mg", "Losartan 50mg", "Vitamin C 500mg",
    "Alpha Choay", "Oresol", "Nước muối sinh lý 0.9%"
];

const COMMON_DOSAGES = [
    "1 viên/lần", "2 viên/lần", "1/2 viên/lần",
    "5ml/lần", "10ml/lần", "1 gói/lần", "1 ống/lần"
];

const COMMON_INSTRUCTIONS = [
    "Uống x 2 lần/ngày (Sáng - Tối) sau ăn",
    "Uống x 3 lần/ngày (Sáng - Trưa - Tối) sau ăn",
    "Uống x 1 lần/ngày (Sáng) trước ăn",
    "Uống khi đau/sốt (cách nhau 4-6h)",
    "Ngậm dưới lưỡi",
    "Bôi ngoài da 2 lần/ngày"
];

export default function MedicalRecordsPage() {
    const navigate = useNavigate();
    const location = useLocation();
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
    const [editRecordId, setEditRecordId] = useState(null);

    const patientRefs = useRef({});

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [historySearch, setHistorySearch] = useState("");
    const [filterDate, setFilterDate] = useState("");

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formPatientId, setFormPatientId] = useState("");
    const [formQueueEntryId, setFormQueueEntryId] = useState(null);
    const [formAppointmentId, setFormAppointmentId] = useState(null);
    const [formDiagnosis, setFormDiagnosis] = useState("");
    const [formStatus, setFormStatus] = useState("Hoàn thành");
    const [formVitals, setFormVitals] = useState({
        weight: "",
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        spo2: ""
    });
    const [formSymptomInput, setFormSymptomInput] = useState("");
    const [formSymptoms, setFormSymptoms] = useState([]);
    const [formNotes, setFormNotes] = useState("");

    // Encounter services (multi-step)
    const [encounterId, setEncounterId] = useState(null);
    const [encounterServices, setEncounterServices] = useState([]);
    const [serviceTypeInput, setServiceTypeInput] = useState("VITALS");
    const [assignedRoomInput, setAssignedRoomInput] = useState("");
    const [encounterLoading, setEncounterLoading] = useState(false);
    const [encounterError, setEncounterError] = useState("");

    const SERVICE_OPTIONS = [
        { value: "VITALS", label: "Sinh hiệu" },
        { value: "BLOOD_TEST", label: "Lấy máu" },
        { value: "DENTAL", label: "RHM" },
        { value: "X_RAY", label: "X-Quang" },
        { value: "ULTRASOUND", label: "Siêu âm" },
    ];

    const MEDICINE_LIST = [
        { id: "MED-001", name: "Panadol Extra", unit: "Viên" },
        { id: "MED-002", name: "Decolgen", unit: "Viên" },
        { id: "MED-003", name: "Augmentin 1g", unit: "Viên" },
        { id: "MED-004", name: "Paracetamol 500mg", unit: "Viên" },
        { id: "MED-005", name: "Alphachymotrypsin", unit: "Viên" },
        { id: "MED-006", name: "Vitamin C 500mg", unit: "Viên" },
        { id: "MED-007", name: "Siro Prospan", unit: "Chai" },
        { id: "MED-008", name: "Domperidon 10mg", unit: "Viên" }
    ];

    const [formPrescriptionInput, setFormPrescriptionInput] = useState({
        medicine_id: "",
        medicine_name: "",
        dosage_per_time: 1,
        frequency_per_day: 2,
        total_days: 5,
        unit: "Viên",
        instruction: "Uống sau ăn sáng/tối"
    });
    const [formPrescriptions, setFormPrescriptions] = useState([]);

    // Advanced Form State (7 Sections)
    const [formAdminInfo, setFormAdminInfo] = useState({ occupation: "", idCard: "", address: "", relativePhone: "" });
    const [formMedicalMgmt, setFormMedicalMgmt] = useState({ recordNumber: "", objectType: "Dịch vụ" });
    const [formAnamnesis, setFormAnamnesis] = useState({ reason: "" });
    const [formExamination, setFormExamination] = useState({ general: "", parts: "" });
    const [formParaclinical, setFormParaclinical] = useState({ tests: "", imaging: "", endoscopy: "" });
    const [formTreatment, setFormTreatment] = useState({ advice: "", followUp: "" });

    // Dropdown state
    const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
    const [showDosageDropdown, setShowDosageDropdown] = useState(false);
    const [showInstructionDropdown, setShowInstructionDropdown] = useState(false);

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
                const locationState = location.state;
                if (locationState?.patientId && isDoctor) {
                    setSelectedPatientId(locationState.patientId);
                    setFormPatientId(locationState.patientId);
                    if (locationState.appointmentId) {
                        setFormAppointmentId(locationState.appointmentId);
                    }
                    if (locationState.queueEntryId) {
                        setFormQueueEntryId(locationState.queueEntryId);
                    }
                    // Delay setting showForm to prevent the other useEffect from overwriting it
                    setTimeout(() => setShowForm(true), 100);
                } else if (locationState?.patientName && isDoctor) {
                    // Came from DoctorQueuePage — pre-fill search with patient name
                    setSearchTerm(locationState.patientName);
                    if (locationState.queueEntryId) {
                        setFormQueueEntryId(locationState.queueEntryId);
                    }
                    if (locationState.appointmentId) {
                        setFormAppointmentId(locationState.appointmentId);
                    }
                    
                    // Auto-select patient
                    const matchedPatient = patientsRes.patients?.find(
                        p => p.name.toLowerCase() === locationState.patientName.toLowerCase() || 
                             (p.phoneNumber && p.phoneNumber === locationState.patientPhone)
                    );
                    
                    if (matchedPatient) {
                        setSelectedPatientId(matchedPatient._id);
                        setFormPatientId(matchedPatient._id);
                    }

                    setTimeout(() => setShowForm(true), 100);
                }
            } catch (err) {
                console.error("Error fetching medical records data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isDoctor, isStaff, user?.email, location.state]);

    useEffect(() => {
        // Reset selected record when patient changes
        setSelectedRecordId(null);
        setEditRecordId(null);
        setShowForm(false);
        
        // Scroll to selected patient in the sidebar
        if (selectedPatientId && patientRefs.current[selectedPatientId]) {
            patientRefs.current[selectedPatientId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedPatientId]);

    useEffect(() => {
        const fetchActiveEncounter = async () => {
            if (!showForm) {
                setEncounterId(null);
                setEncounterServices([]);
                setEncounterError("");
                return;
            }

            const targetPatientId = formPatientId || selectedPatientId;
            if (!targetPatientId) {
                setEncounterId(null);
                setEncounterServices([]);
                setEncounterError("");
                return;
            }
            try {
                setEncounterServices([]); // Đảm bảo clear state trước khi check
                const res = await getActiveEncounterApi(targetPatientId);
                if (res.encounter) {
                    setEncounterId(res.encounter._id);
                    setEncounterServices(res.encounter.services || []);
                } else {
                    setEncounterId(null);
                    setEncounterServices([]);
                }
            } catch (err) {
                console.error("Lỗi lấy active encounter:", err);
                setEncounterId(null);
                setEncounterServices([]);
            }
            setEncounterError("");
        };
        fetchActiveEncounter();
    }, [formPatientId, selectedPatientId, showForm]);

    // Socket.io: Bác sĩ chính nhận cập nhật realtime từ khoa cận lâm sàng
    useEffect(() => {
        if (!user?._id || !isDoctor) return;

        connectSocket();
        socket.on("connect", () => joinDoctorRoom(user._id));

        socket.on("patient_progress_updated", (updatedService) => {
            setEncounterServices((prev) =>
                prev.map((s) => (s._id === updatedService._id ? updatedService : s))
            );
        });

        return () => {
            socket.off("connect");
            socket.off("patient_progress_updated");
            disconnectSocket();
        };
    }, [user?._id, isDoctor]);

    // Hàm trợ giúp parse thông tin từ form nâng cao
    const getParsedNotes = (notes) => {
        if (!notes) return null;
        try {
            const parsed = JSON.parse(notes);
            if (parsed && typeof parsed === 'object' && (parsed.anamnesis || parsed.history)) {
                return parsed;
            }
            return null;
        } catch (e) {
            return null;
        }
    };

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

    const handleAddEncounterService = async () => {
        const targetPatientId = formPatientId || selectedPatientId;
        if (!targetPatientId) {
            setEncounterError("Vui lòng chọn bệnh nhân trước khi chỉ định dịch vụ.");
            return;
        }

        try {
            setEncounterLoading(true);
            setEncounterError("");

            let activeEncounterId = encounterId;
            if (!activeEncounterId) {
                const startRes = await startEncounterApi({ patientId: targetPatientId });
                activeEncounterId = startRes.encounter?._id;
                setEncounterId(activeEncounterId || null);
                setEncounterServices(startRes.encounter?.services || []);
            }

            if (!activeEncounterId) {
                setEncounterError("Không thể khởi tạo đợt khám.");
                return;
            }

            const created = await createEncounterServiceApi({
                encounterId: activeEncounterId,
                serviceType: serviceTypeInput,
                assignedRoom: assignedRoomInput || undefined,
            });

            if (created?.service) {
                const hydratedService = { ...created.service };
                if (assignedRoomInput) {
                    hydratedService.assignedRoom = { name: assignedRoomInput };
                }
                setEncounterServices((prev) => [...prev, hydratedService]);
                setAssignedRoomInput("");
            }
        } catch (err) {
            setEncounterError(err?.response?.data?.message || "Không thể thêm dịch vụ.");
        } finally {
            setEncounterLoading(false);
        }
    };

    const handleSymptomKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSymptom();
        }
    };

    const handleMedicineSelect = (medicineName) => {
        const med = MEDICINE_LIST.find(m => m.name === medicineName);
        if (med) {
            setFormPrescriptionInput({ ...formPrescriptionInput, medicine_id: med.id, medicine_name: med.name, unit: med.unit });
        } else {
            setFormPrescriptionInput({ ...formPrescriptionInput, medicine_id: "", medicine_name: medicineName, unit: "Viên" });
        }
    };

    const addPrescription = () => {
        if (formPrescriptionInput.medicine_name.trim()) {
            const totalQty = formPrescriptionInput.dosage_per_time * formPrescriptionInput.frequency_per_day * formPrescriptionInput.total_days;
            const newPrescription = {
                ...formPrescriptionInput,
                total_quantity: totalQty
            };
            setFormPrescriptions([...formPrescriptions, newPrescription]);
            setFormPrescriptionInput({
                medicine_id: "",
                medicine_name: "",
                dosage_per_time: 1,
                frequency_per_day: 2,
                total_days: 5,
                unit: "Viên",
                instruction: "Uống sau ăn sáng/tối"
            });
        }
    };

    const removePrescription = (idx) => {
        setFormPrescriptions(formPrescriptions.filter((_, i) => i !== idx));
    };

    const handleEditRecord = (record) => {
        setEditRecordId(record._id);
        setFormPatientId(record.patientId?._id || record.patientId);
        setFormDiagnosis(record.diagnosis || "");
        setFormStatus(record.status || "Hoàn thành");
        setFormVitals(record.vitals || { weight: "", bloodPressure: "", heartRate: "", temperature: "", spo2: "" });
        setFormSymptoms(record.symptoms || []);
        setFormSymptomInput("");
        setFormPrescriptions(record.prescriptions || []);

        const parsedNotes = getParsedNotes(record.notes);
        if (parsedNotes && parsedNotes.anamnesis) {
            setFormAdminInfo(parsedNotes.adminInfo || { occupation: "", idCard: "", address: "", relativePhone: "" });
            setFormMedicalMgmt(parsedNotes.medicalMgmt || { recordNumber: "", objectType: "Dịch vụ" });
            setFormAnamnesis(parsedNotes.anamnesis || { reason: "" });
            setFormExamination(parsedNotes.examination || { general: "", parts: "" });
            setFormParaclinical(parsedNotes.paraclinical || { tests: "", imaging: "", endoscopy: "" });
            setFormTreatment(parsedNotes.treatment || { advice: "", followUp: "" });
            setFormNotes(parsedNotes.generalNotes || "");
        } else {
            setFormAdminInfo({ occupation: "", idCard: "", address: "", relativePhone: "" });
            setFormMedicalMgmt({ recordNumber: "", objectType: "Dịch vụ" });
            setFormAnamnesis({ reason: "" });
            setFormExamination({ general: "", parts: "" });
            setFormParaclinical({ tests: "", imaging: "", endoscopy: "" });
            setFormTreatment({ advice: "", followUp: "" });
            setFormNotes(record.notes || "");
        }
        
        setSelectedRecordId(null);
        setShowForm(true);
    };

    const handleSaveRecord = async () => {
        const targetPatientId = formPatientId || selectedPatientId;
        if (!targetPatientId || !formDiagnosis.trim()) return;

        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        const advancedNotes = JSON.stringify({
            adminInfo: formAdminInfo,
            medicalMgmt: formMedicalMgmt,
            anamnesis: formAnamnesis,
            examination: formExamination,
            paraclinical: formParaclinical,
            treatment: formTreatment,
            generalNotes: formNotes,
            prescriptionItems: formPrescriptions
        });
        
        const finalSymptoms = [...formSymptoms];
        if (formSymptomInput.trim() && !finalSymptoms.includes(formSymptomInput.trim())) {
            finalSymptoms.push(formSymptomInput.trim());
        }

        try {
            const payload = {
                patientId: targetPatientId,
                encounterId: encounterId || null,
                diagnosis: formDiagnosis.trim(),
                symptoms: finalSymptoms,
                notes: advancedNotes,
                date: dateStr,
                vitals: formVitals,
                status: formStatus,
                prescriptions: formPrescriptions.map(p => ({
                    name: p.medicine_name || p.name,
                    dosage: p.dosage_per_time ? `${p.dosage_per_time} ${p.unit || 'Viên'}` : p.dosage,
                    duration: p.total_days ? `${p.total_days} ngày` : p.duration,
                    instructions: p.frequency_per_day ? `Ngày uống ${p.frequency_per_day} lần. Tổng: ${p.total_quantity} ${p.unit || 'Viên'}. HD: ${p.instruction || ""}` : (p.instructions || "")
                }))
            };

            let res;
            if (editRecordId) {
                res = await updateMedicalRecordApi(editRecordId, payload);
            } else {
                res = await createMedicalRecordApi(payload);
            }

            if (res.record) {
                if (formAppointmentId) {
                    try {
                        await updateAppointmentStatusApi(formAppointmentId, "completed");
                    } catch (err) {
                        console.error("Failed to complete appointment automatically:", err);
                    }
                }
                if (formQueueEntryId) {
                    try {
                        await updateQueueStatusApi(formQueueEntryId, "completed");
                    } catch (err) {
                        console.error("Failed to sync queue status:", err);
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
                setFormNotes("");
                setFormVitals({ weight: "", bloodPressure: "", heartRate: "", temperature: "", spo2: "" });
                setFormPrescriptions([]);
                setFormAdminInfo({ occupation: "", idCard: "", address: "", relativePhone: "" });
                setFormMedicalMgmt({ recordNumber: "", objectType: "Dịch vụ" });
                setFormAnamnesis({ reason: "" });
                setFormExamination({ general: "", parts: "" });
                setFormParaclinical({ tests: "", imaging: "", endoscopy: "" });
                setFormTreatment({ advice: "", followUp: "" });
                setShowForm(false);
                setEditRecordId(null);
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
                                            {(() => {
                                                const parsed = getParsedNotes(record.notes);
                                                if (parsed && parsed.anamnesis) {
                                                    return (
                                                        <div className="mt-4 space-y-4 mb-4">
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-gray-800 border-b pb-1 mb-2">Hỏi bệnh & Thăm khám</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">Lý do khám:</span> {parsed.anamnesis?.reason}</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">Khám bộ phận:</span> {parsed.examination?.parts}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-gray-800 border-b pb-1 mb-2">Điều trị & Theo dõi</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">Lời dặn:</span> {parsed.treatment?.advice}</p>
                                                                <p className="text-gray-600"><span className="text-gray-500">Hẹn tái khám:</span> {parsed.treatment?.followUp}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                } else if (parsed && parsed.history) {
                                                    return (
                                                        <div className="mt-4 space-y-4 mb-4">
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-gray-800 border-b pb-1 mb-2">Thăm khám lâm sàng</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">Lý do khám:</span> {parsed.clinical?.reason}</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">Khám bộ phận:</span> {parsed.clinical?.examination}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-gray-800 border-b pb-1 mb-2">Cận lâm sàng</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">Xét nghiệm:</span> {parsed.paraclinical?.tests || "Không có"}</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">Hình ảnh/TDCN:</span> {parsed.paraclinical?.imaging || "Không có"}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-gray-800 border-b pb-1 mb-2">Điều trị & Chăm sóc</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">Phương pháp:</span> {parsed.treatmentMethod}</p>
                                                                <p className="text-gray-600"><span className="text-gray-500">Hướng dẫn:</span> {parsed.careInstructions}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return <p className="text-gray-600 text-sm mb-4">{record.notes}</p>;
                                            })()}
                                            
                                            {record.symptoms && record.symptoms.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                                        🏷️ Triệu chứng:
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {record.symptoms.map((s, i) => (
                                                            <span key={i} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {record.prescriptions && record.prescriptions.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <h4 className="text-sm font-bold text-blue-600 mb-2 flex items-center gap-2">
                                                        💊 Đơn thuốc điều trị:
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {record.prescriptions.map((p, i) => (
                                                            <div key={i} className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg flex justify-between items-center">
                                                                <div>
                                                                    <span className="font-bold text-blue-600">{p.name}</span>
                                                                    <span className="mx-2 text-gray-400">•</span>
                                                                    <span>{p.dosage} {p.instructions ? `- ${p.instructions}` : ''}</span>
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
            <div className="w-[320px] bg-white border-r flex flex-col shadow-sm print:hidden">
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
                                    // Do not reset form here, allow Quick Create button to handle it
                                    // setSelectedRecordId(null);
                                    // setShowForm(false);
                                }}
                                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${isSelected ? "bg-[#EFF6FF] border border-blue-100" : "hover:bg-gray-50 border border-transparent"
                                    }`}
                            >
                                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                                    {patient.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-sm truncate ${isSelected ? "text-blue-700" : "text-[#1E293B]"}`}>
                                        {patient.name}
                                    </h3>
                                    <p className="text-[11px] text-[#64748B] truncate">{patient.email}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="px-2 py-0.5 bg-[#E0E7FF] text-[#4338CA] text-[10px] font-bold rounded-full">
                                        {count} hồ sơ
                                    </span>
                                    {isDoctor && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedPatientId(patient._id);
                                                setFormPatientId(patient._id);
                                                setFormAppointmentId(null);
                                                setSelectedRecordId(null);
                                                setEditRecordId(null);
                                                setFormDiagnosis("");
                                                setFormSymptoms([]);
                                                setFormSymptomInput("");
                                                setFormNotes("");
                                                setFormVitals({ weight: "", bloodPressure: "", heartRate: "", temperature: "", spo2: "" });
                                                setFormPrescriptions([]);
                                                setFormAdminInfo({ occupation: "", idCard: "", address: "", relativePhone: "" });
                                                setFormMedicalMgmt({ recordNumber: "", objectType: "Dịch vụ" });
                                                setFormAnamnesis({ reason: "" });
                                                setFormExamination({ general: "", parts: "" });
                                                setFormParaclinical({ tests: "", imaging: "", endoscopy: "" });
                                                setFormTreatment({ advice: "", followUp: "" });
                                                setTimeout(() => setShowForm(true), 50);
                                            }}
                                            className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 rounded-lg border border-gray-100 hover:border-blue-200 transition-all shadow-sm group/btn"
                                            title="Tạo nhanh hồ sơ"
                                        >
                                            <svg className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Middle: History Timeline */}
            <div className="flex-1 bg-white border-r flex flex-col shadow-sm print:hidden">
                <div className="p-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-[#1E293B]">Lịch sử khám</h2>
                    <button
                        onClick={() => {
                            setEditRecordId(null);
                            setFormDiagnosis("");
                            setFormSymptoms([]);
                            setFormSymptomInput("");
                            setFormNotes("");
                            setFormVitals({ weight: "", bloodPressure: "", heartRate: "", temperature: "", spo2: "" });
                            setFormPrescriptions([]);
                            setFormAdminInfo({ occupation: "", idCard: "", address: "", relativePhone: "" });
                            setFormMedicalMgmt({ recordNumber: "", objectType: "Dịch vụ" });
                            setFormAnamnesis({ reason: "" });
                            setFormExamination({ general: "", parts: "" });
                            setFormParaclinical({ tests: "", imaging: "", endoscopy: "" });
                            setFormTreatment({ advice: "", followUp: "" });
                            setShowForm(true);
                        }}
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
            <div id="record-detail-area" className={`w-[600px] print:w-full bg-white border-l transition-all duration-300 flex flex-col shadow-xl ${(showForm || selectedRecordId) ? "mr-0" : "-mr-[600px]"}`}>
                {showForm ? (
                    <>
                        {/* Professional form header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-1">Phíu khám bệnh</p>
                                    <h2 className="text-xl font-bold">Tạo hồ sơ bệnh án</h2>
                                    {selectedPatient && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{selectedPatient.name[0]}</div>
                                            <span className="text-sm text-blue-100 font-medium">{selectedPatient.name}</span>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white/80 hover:text-white transition">
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 bg-[#F8FAFC]">
                            {/* Service Orders */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Chỉ định dịch vụ</h3>
                                    {encounterId && (
                                        <span className="text-xs text-gray-400">Mã đợt: {String(encounterId).slice(0, 8)}...</span>
                                    )}
                                </div>
                                <div className="flex flex-col lg:flex-row gap-3">
                                    <select
                                        value={serviceTypeInput}
                                        onChange={(e) => setServiceTypeInput(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                    >
                                        {SERVICE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={assignedRoomInput}
                                        onChange={(e) => setAssignedRoomInput(e.target.value)}
                                        placeholder="Số phòng / Khu"
                                        className="w-full lg:w-40 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddEncounterService}
                                        disabled={encounterLoading}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${encounterLoading ? "bg-gray-300 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                                    >
                                        {encounterLoading ? "Đang thêm..." : "Thêm dịch vụ"}
                                    </button>
                                </div>
                                {encounterError && (
                                    <p className="text-xs text-red-600 mt-2">{encounterError}</p>
                                )}
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {encounterServices.length === 0 ? (
                                        <div className="text-xs text-gray-500 italic">Chưa có dịch vụ nào.</div>
                                    ) : (
                                        encounterServices.map((svc) => (
                                            <div key={svc._id} className="border border-gray-100 rounded-lg p-3 bg-slate-50 flex flex-col h-full">
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {SERVICE_OPTIONS.find(o => o.value === svc.serviceType)?.label || svc.serviceType}
                                                        </p>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                            svc.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                            svc.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-gray-200 text-gray-600'
                                                        }`}>
                                                            {svc.status === 'COMPLETED' ? 'Hoàn thành' : svc.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Chờ khám'}
                                                        </span>
                                                    </div>
                                                    {svc.assignedRoom && (
                                                        <p className="text-xs text-gray-500 mt-1">Phòng: {svc.assignedRoom?.name || svc.assignedRoom}</p>
                                                    )}
                                                </div>
                                                
                                                {(svc.resultData || svc.resultImageUrl) && (
                                                    <div className="mt-3 bg-white p-2.5 rounded-lg border border-emerald-100 shadow-sm whitespace-pre-wrap">
                                                        <p className="text-xs font-bold text-emerald-700 mb-1 flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Kết quả:
                                                        </p>
                                                        {svc.resultData && (
                                                            <p className="text-xs text-gray-700 leading-relaxed font-medium">{svc.resultData}</p>
                                                        )}
                                                        {svc.resultImageUrl && (
                                                            <a href={svc.resultImageUrl} target="_blank" rel="noreferrer" className="text-blue-500 text-xs font-bold hover:underline mt-2 flex items-center gap-1 w-fit">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                Xem ảnh đính kèm
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* I. Hành chính */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">I. Hành chính</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div><span className="text-gray-500 block text-xs mb-1">Họ tên</span> <span className="font-semibold text-gray-900">{selectedPatient?.name}</span></div>
                                    <div><span className="text-gray-500 block text-xs mb-1">Giới tính</span> <span className="font-semibold text-gray-900">{selectedPatient?.gender === "male" ? "Nam" : selectedPatient?.gender === "female" ? "Nữ" : "Khác"}</span></div>
                                    <div><span className="text-gray-500 block text-xs mb-1">Ngày sinh</span> <span className="font-semibold text-gray-900">{"Chưa cập nhật"}</span></div>
                                    <div><span className="text-gray-500 block text-xs mb-1">SĐT BN</span> <span className="font-semibold text-gray-900">{selectedPatient?.phoneNumber || "Chưa cập nhật"}</span></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Nghề nghiệp</label>
                                        <input type="text" value={formAdminInfo.occupation} onChange={e => setFormAdminInfo({...formAdminInfo, occupation: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Số CCCD</label>
                                        <input type="text" value={formAdminInfo.idCard} onChange={e => setFormAdminInfo({...formAdminInfo, idCard: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Địa chỉ</label>
                                        <input type="text" value={formAdminInfo.address} onChange={e => setFormAdminInfo({...formAdminInfo, address: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">SĐT người thân (khi cần)</label>
                                        <input type="text" value={formAdminInfo.relativePhone} onChange={e => setFormAdminInfo({...formAdminInfo, relativePhone: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Vitals */}
                            <div>
                                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-3">📊 Chỉ số cơ bản (Vitals)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <input type="text" placeholder="Cân nặng" value={formVitals.weight} onChange={e => setFormVitals({ ...formVitals, weight: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none" />
                                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">kg</span>
                                    </div>
                                    <div className="relative">
                                        <input type="text" placeholder="Huyết áp" value={formVitals.bloodPressure} onChange={e => setFormVitals({ ...formVitals, bloodPressure: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none" />
                                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">mmHg</span>
                                    </div>
                                    <div className="relative">
                                        <input type="text" placeholder="Nhịp tim" value={formVitals.heartRate} onChange={e => setFormVitals({ ...formVitals, heartRate: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none" />
                                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">bpm</span>
                                    </div>
                                    <div className="relative">
                                        <input type="text" placeholder="Nhiệt độ" value={formVitals.temperature} onChange={e => setFormVitals({ ...formVitals, temperature: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none" />
                                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">°C</span>
                                    </div>
                                </div>
                            </div>

                            {/* II. Quản lý người bệnh */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">II. Quản lý người bệnh</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Mã hồ sơ (Tuỳ chọn)</label>
                                        <input type="text" value={formMedicalMgmt.recordNumber} onChange={e => setFormMedicalMgmt({...formMedicalMgmt, recordNumber: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Đối tượng khám</label>
                                        <select value={formMedicalMgmt.objectType} onChange={e => setFormMedicalMgmt({...formMedicalMgmt, objectType: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none">
                                            <option value="Dịch vụ">Dịch vụ</option>
                                            <option value="BHYT">BHYT</option>
                                            <option value="Khám sức khỏe">Khám sức khỏe</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* III. Lý do khám & Bệnh sử */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">III. Hỏi bệnh</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">1. Lý do khám bệnh / Bệnh sử</label>
                                        <textarea value={formAnamnesis.reason} onChange={e => setFormAnamnesis({...formAnamnesis, reason: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400" placeholder="Triệu chứng chính khiến bệnh nhân đi khám..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-2">2. Các Triệu chứng cụ thể (Hỗ trợ chẩn đoán)</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={formSymptomInput}
                                                onChange={e => setFormSymptomInput(e.target.value)}
                                                onKeyDown={handleSymptomKeyDown}
                                                placeholder="Nhập triệu chứng rồi Enter..."
                                                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button onClick={addSymptom} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition">+</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formSymptoms.map((s, i) => (
                                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                                                    {s}
                                                    <button onClick={() => removeSymptom(i)} className="text-blue-400 hover:text-red-500 transition">✕</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* IV. Khám bệnh */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">IV. Khám bệnh</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">1. Khám Toàn thân</label>
                                        <textarea value={formExamination.general} onChange={e => setFormExamination({...formExamination, general: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400" placeholder="Da niêm mạc, hạch bạch huyết, tuyến giáp..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">2. Khám Bộ phận</label>
                                        <textarea value={formExamination.parts} onChange={e => setFormExamination({...formExamination, parts: e.target.value})} rows={3} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400" placeholder="Tim mạch, hô hấp, tiêu hoá..." />
                                    </div>
                                </div>
                            </div>
                            
                            {/* V. Cận lâm sàng */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">V. Cận lâm sàng</h3>
                                {encounterServices.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        Chưa có dịch vụ cận lâm sàng nào được chỉ định.
                                    </p>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tên dịch vụ</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Trạng thái</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Kết luận / Kết quả</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {encounterServices.map(svc => (
                                                    <tr key={svc._id}>
                                                        <td className="px-4 py-3 text-sm text-black font-semibold">
                                                            {svc.serviceType === 'VITALS' ? 'Sinh hiệu' 
                                                            : svc.serviceType === 'BLOOD_TEST' ? 'Trắc nghiệm máu'
                                                            : svc.serviceType === 'DENTAL' ? 'Răng Hàm Mặt'
                                                            : svc.serviceType === 'X_RAY' ? 'Chụp X-Quang'
                                                            : svc.serviceType === 'ULTRASOUND' ? 'Siêu âm'
                                                            : svc.serviceType}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                                svc.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                                                svc.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {svc.status === 'COMPLETED' ? 'Hoàn thành' : svc.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Chờ khám'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            {svc.status === 'COMPLETED' && (svc.resultData || svc.resultImageUrl) ? (
                                                                <div className="text-black whitespace-pre-wrap font-medium">
                                                                    {svc.resultData}
                                                                    {svc.resultImageUrl && (
                                                                       <a href={svc.resultImageUrl} target="_blank" rel="noreferrer" className="text-blue-600 block mt-1 underline">
                                                                           Xem ảnh KQ
                                                                       </a>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 italic font-medium">Chưa có...</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* VI. Tổng kết bệnh */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">VI. Tổng kết bệnh</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Chẩn đoán bệnh (*)</label>
                                        <input
                                            type="text"
                                            value={formDiagnosis}
                                            onChange={e => setFormDiagnosis(e.target.value)}
                                            placeholder="Nhập chẩn đoán xác định..."
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-1">Trạng thái hồ sơ</label>
                                            <select
                                                value={formStatus}
                                                onChange={e => setFormStatus(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="Hoàn thành">Hoàn thành</option>
                                                <option value="Đang điều trị">Đang điều trị</option>
                                                <option value="Chờ kết quả">Chờ kết quả</option>
                                                <option value="Chuyển viện">Chuyển viện</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* VII. Điều trị & Theo dõi */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">VII. Điều trị & Theo dõi</h3>
                                
                                <div className="space-y-4">
                                    {/* 1. Đơn thuốc */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-2">1. Đơn thuốc thông minh</label>
                                        <div className="space-y-3 mb-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] text-gray-500 uppercase font-bold">Tên thuốc</label>
                                                <input
                                                    type="text"
                                                    list="medicine-list"
                                                    autoComplete="off"
                                                    placeholder="Gõ hoặc chọn tên thuốc..."
                                                    value={formPrescriptionInput.medicine_name}
                                                    onChange={e => handleMedicineSelect(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                                <datalist id="medicine-list">
                                                    {MEDICINE_LIST.map((m) => (
                                                        <option key={m.id} value={m.name} />
                                                    ))}
                                                </datalist>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] text-gray-500 uppercase font-bold">Mỗi lần</label>
                                                    <select
                                                        value={formPrescriptionInput.dosage_per_time}
                                                        onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, dosage_per_time: Number(e.target.value) })}
                                                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value={0.5}>0.5 {formPrescriptionInput.unit}</option>
                                                        <option value={1}>1 {formPrescriptionInput.unit}</option>
                                                        <option value={1.5}>1.5 {formPrescriptionInput.unit}</option>
                                                        <option value={2}>2 {formPrescriptionInput.unit}</option>
                                                        <option value={3}>3 {formPrescriptionInput.unit}</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] text-gray-500 uppercase font-bold">Tần suất</label>
                                                    <select
                                                        value={formPrescriptionInput.frequency_per_day}
                                                        onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, frequency_per_day: Number(e.target.value) })}
                                                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value={1}>1 lần/ngày</option>
                                                        <option value={2}>2 lần/ngày</option>
                                                        <option value={3}>3 lần/ngày</option>
                                                        <option value={4}>4 lần/ngày</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] text-gray-500 uppercase font-bold">Số ngày</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={formPrescriptionInput.total_days}
                                                            onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, total_days: Number(e.target.value) })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10"
                                                        />
                                                        <span className="absolute right-3 top-2 text-sm text-gray-400">ngày</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] text-gray-500 uppercase font-bold">Hướng dẫn thêm</label>
                                                <input
                                                    type="text"
                                                    value={formPrescriptionInput.instruction}
                                                    onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, instruction: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Ví dụ: Uống sau ăn sáng/tối"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                                <span className="text-xs text-gray-600 font-medium">Tổng cộng:</span>
                                                <span className="text-sm font-bold text-blue-700">
                                                    {formPrescriptionInput.dosage_per_time * formPrescriptionInput.frequency_per_day * formPrescriptionInput.total_days} {formPrescriptionInput.unit}
                                                </span>
                                            </div>

                                            <button
                                                onClick={addPrescription}
                                                type="button"
                                                className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                                            >
                                                + Thêm thuốc vào đơn
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {formPrescriptions.map((p, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-xl shadow-sm">
                                                    <div className="flex flex-1 items-start gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600">💊</div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <p className="text-sm font-bold text-gray-800">{p.medicine_name || p.name}</p>
                                                                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                                                    TỔNG: {p.total_quantity || "N/A"} {p.unit || "Viên"}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 font-medium">
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded">Mỗi lần {p.dosage_per_time} {p.unit}</span>
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded">{p.frequency_per_day} lần/ngày</span>
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded">Trong {p.total_days} ngày</span>
                                                            </div>
                                                            <p className="text-[11px] text-gray-400 mt-1 italic">HD: {p.instruction}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removePrescription(i)} className="p-2 ml-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition">✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. Lời dặn */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">2. Lời dặn bác sĩ</label>
                                        <textarea value={formTreatment.advice} onChange={e => setFormTreatment({...formTreatment, advice: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400" placeholder="Chế độ ăn uống, sinh hoạt, tập luyện..." />
                                    </div>


                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">📝 Ghi chú & Hướng dẫn</label>
                                <textarea
                                    value={formNotes}
                                    onChange={e => setFormNotes(e.target.value)}
                                    placeholder="Nhập ghi chú điều trị, hướng dẫn tái khám..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none resize-none"
                                />
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
                                <div id="print-hide-header" className="p-5 border-b flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm print:hidden">
                                    <div>
                                        <h2 className="text-xl font-bold text-[#1E293B]">Chi tiết hồ sơ</h2>
                                        <p className="text-xs text-[#64748B] mt-1">{formatDate(record.date)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {record.status !== "Hoàn thành" && (
                                            <button 
                                                onClick={() => handleEditRecord(record)} 
                                                className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition"
                                            >
                                                ✎ Sửa hồ sơ
                                            </button>
                                        )}
                                        <button
                                            onClick={() => window.print()}
                                            className="text-gray-700 hover:text-gray-900 text-sm font-bold flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition shadow-sm"
                                        >
                                            🖨️ In hồ sơ
                                        </button>
                                        <button onClick={() => setSelectedRecordId(null)} className="text-[#94A3B8] hover:text-[#475569] text-sm flex items-center gap-1">
                                            ✕ Đóng
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 bg-[#F8FAFC]">
                                    {(() => {
                                        const parsedNotes = getParsedNotes(record.notes);
                                        
                                        if (parsedNotes && parsedNotes.anamnesis) {
                                            return (
                                                <>
                                                    {/* I. Hành chính */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">I. Hành chính</h3>
                                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                            <div><span className="text-gray-500 block text-xs mb-1">Họ tên</span> <span className="font-semibold text-gray-900">{record.patientId?.name || "Bệnh nhân"}</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">Giới tính</span> <span className="font-semibold text-gray-900">{record.patientId?.gender === "male" ? "Nam" : record.patientId?.gender === "female" ? "Nữ" : "Khác"}</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">Ngày sinh</span> <span className="font-semibold text-gray-900">Chưa cập nhật</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">SĐT BN</span> <span className="font-semibold text-gray-900">{record.patientId?.phoneNumber || "Chưa cập nhật"}</span></div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-4">
                                                            <div><span className="text-gray-500 block text-xs mb-1">Nghề nghiệp</span> <span className="font-semibold text-gray-900">{parsedNotes.adminInfo?.occupation || "—"}</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">Số CCCD</span> <span className="font-semibold text-gray-900">{parsedNotes.adminInfo?.idCard || "—"}</span></div>
                                                            <div className="col-span-2"><span className="text-gray-500 block text-xs mb-1">Địa chỉ</span> <span className="font-semibold text-gray-900">{parsedNotes.adminInfo?.address || "—"}</span></div>
                                                            <div className="col-span-2"><span className="text-gray-500 block text-xs mb-1">SĐT người thân (khi cần)</span> <span className="font-semibold text-gray-900">{parsedNotes.adminInfo?.relativePhone || "—"}</span></div>
                                                        </div>
                                                    </div>

                                                    {/* II. Quản lý y tế */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">II. Quản lý y tế</h3>
                                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                            <div><span className="text-gray-500 block text-xs mb-1">Mã số bệnh nhân (ID)</span> <span className="font-semibold text-gray-900">{record.patientId?._id ? record.patientId._id.substring(0, 8) + "..." : "—"}</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">Ngày giờ khám</span> <span className="font-semibold text-gray-900">{formatDate(record.date)}</span></div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-4">
                                                            <div><span className="text-gray-500 block text-xs mb-1">Số hồ sơ</span> <span className="font-semibold text-gray-900">{parsedNotes.medicalMgmt?.recordNumber || "—"}</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">Đối tượng</span> <span className="font-semibold text-gray-900">{parsedNotes.medicalMgmt?.objectType || "Dịch vụ"}</span></div>
                                                        </div>
                                                    </div>

                                                    {/* III. Hỏi bệnh */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">III. Hỏi bệnh</h3>
                                                        <div className="text-sm">
                                                            <span className="text-gray-500 block text-xs mb-1">Lý do đến khám</span> 
                                                            <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.anamnesis?.reason || "—"}</p>
                                                        </div>
                                                    </div>

                                                    {/* IV. Thăm khám */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">IV. Thăm khám</h3>
                                                        <div className="space-y-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">1. Tình trạng</span> 
                                                                <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.examination?.general || "—"}</p>
                                                            </div>
                                                            
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-2">2. Chỉ số sinh tồn</span>
                                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-gray-500 text-[10px] uppercase font-bold block mb-1">Mạch</span><span className="font-bold text-gray-900">{record.vitals?.heartRate || "—"} <span className="text-xs font-normal text-gray-500">lần/phút</span></span></div>
                                                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-gray-500 text-[10px] uppercase font-bold block mb-1">HA</span><span className="font-bold text-gray-900">{record.vitals?.bloodPressure || "—"} <span className="text-xs font-normal text-gray-500">mmHg</span></span></div>
                                                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-gray-500 text-[10px] uppercase font-bold block mb-1">Nhiệt độ</span><span className="font-bold text-gray-900">{record.vitals?.temperature || "—"} <span className="text-xs font-normal text-gray-500">°C</span></span></div>
                                                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-gray-500 text-[10px] uppercase font-bold block mb-1">SpO2</span><span className="font-bold text-gray-900">{record.vitals?.spo2 || "—"} <span className="text-xs font-normal text-gray-500">%</span></span></div>
                                                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-gray-500 text-[10px] uppercase font-bold block mb-1">Cân nặng</span><span className="font-bold text-gray-900">{record.vitals?.weight || "—"} <span className="text-xs font-normal text-gray-500">kg</span></span></div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">3. Khám bộ phận</span> 
                                                                <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.examination?.parts || "—"}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* V. Cận lâm sàng */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">V. Cận lâm sàng</h3>
                                                        {(!record.encounterId?.services || record.encounterId.services.length === 0) ? (
                                                            <p className="text-sm text-black italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 font-medium">
                                                                Chưa có dữ liệu cận lâm sàng tự động.
                                                            </p>
                                                        ) : (
                                                            <div className="overflow-hidden rounded-xl border border-gray-200">
                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                    <thead className="bg-gray-50">
                                                                        <tr>
                                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tên dịch vụ</th>
                                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Trạng thái</th>
                                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Kết luận / Kết quả</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-100">
                                                                        {record.encounterId.services.map(svc => (
                                                                            <tr key={svc._id}>
                                                                                <td className="px-4 py-3 text-sm text-black font-semibold">
                                                                                    {svc.serviceType === 'VITALS' ? 'Sinh hiệu' 
                                                                                    : svc.serviceType === 'BLOOD_TEST' ? 'Trắc nghiệm máu'
                                                                                    : svc.serviceType === 'DENTAL' ? 'Răng Hàm Mặt'
                                                                                    : svc.serviceType === 'X_RAY' ? 'Chụp X-Quang'
                                                                                    : svc.serviceType === 'ULTRASOUND' ? 'Siêu âm'
                                                                                    : svc.serviceType}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm text-black font-medium">
                                                                                    {svc.status === 'COMPLETED' ? 'Hoàn thành' : svc.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Chờ khám'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-sm">
                                                                                    {svc.status === 'COMPLETED' && (svc.resultData || svc.resultImageUrl) ? (
                                                                                        <div className="text-black whitespace-pre-wrap font-medium">
                                                                                            {svc.resultData}
                                                                                            {svc.resultImageUrl && (
                                                                                               <a href={svc.resultImageUrl} target="_blank" rel="noreferrer" className="text-blue-600 block mt-1 font-bold underline">
                                                                                                   Xem ảnh
                                                                                               </a>
                                                                                            )}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="text-black font-medium italic">Chưa có kết quả</span>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* VI. Tổng kết bệnh */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">VI. Tổng kết bệnh</h3>
                                                        <div className="space-y-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">Chẩn đoán bệnh</span> 
                                                                <p className="font-bold text-gray-900 text-lg text-blue-700">{record.diagnosis}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">Trạng thái hồ sơ</span> 
                                                                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200 uppercase">{record.status || "Hoàn thành"}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-2">Triệu chứng nổi bật (Tags)</span> 
                                                                <div className="flex flex-wrap gap-2">
                                                                    {record.symptoms?.length > 0 ? record.symptoms.map((s, i) => (
                                                                        <span key={i} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                            {s}
                                                                        </span>
                                                                    )) : <span className="text-gray-900 font-semibold">—</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* VII. Điều trị & Theo dõi */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">VII. Điều trị & Theo dõi</h3>
                                                        <div className="space-y-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-2">1. Đơn thuốc</span> 
                                                                {record.prescriptions && record.prescriptions.length > 0 ? (
                                                                    <div className="space-y-2">
                                                                        {parsedNotes.prescriptionItems && parsedNotes.prescriptionItems.length > 0 ? parsedNotes.prescriptionItems.map((p, i) => (
                                                                            <div key={i} className="flex items-start p-3 bg-gray-50 border border-blue-100 rounded-xl">
                                                                                <div className="flex-1">
                                                                                    <div className="flex justify-between items-center mb-1">
                                                                                        <p className="text-sm font-bold text-gray-800">{p.medicine_name}</p>
                                                                                        <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Tổng: {p.total_quantity} {p.unit}</span>
                                                                                    </div>
                                                                                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                                                                                        <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded">Mỗi lần: {p.dosage_per_time} {p.unit}</span>
                                                                                        <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded">{p.frequency_per_day} lần/ngày</span>
                                                                                        <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded">{p.total_days} ngày</span>
                                                                                    </div>
                                                                                    <p className="text-[11px] text-gray-600 mt-1 italic whitespace-pre-wrap">{p.instruction}</p>
                                                                                </div>
                                                                            </div>
                                                                        )) : record.prescriptions.map((p, i) => (
                                                                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                                                                <div className="flex-1">
                                                                                    <p className="text-sm font-bold text-gray-800">{p.name}</p>
                                                                                    <p className="text-[11px] text-gray-500">{p.dosage} • {p.duration}</p>
                                                                                    {p.instructions && <p className="text-[11px] text-gray-500 italic">HD: {p.instructions}</p>}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="font-semibold text-gray-900">—</p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">2. Lời dặn bác sĩ</span> 
                                                                <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.treatment?.advice || "—"}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">3. Hẹn tái khám</span> 
                                                                <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.treatment?.followUp || "—"}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        }
                                        
                                        // Fallback cho định dạng hồ sơ cũ (Legacy)
                                        return (
                                            <div className="space-y-8">
                                                {/* Diagnosis & Status */}
                                                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Chẩn đoán</span>
                                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">
                                                            {record.status || "Hoàn thành"}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-[#1E293B] leading-tight">{record.diagnosis}</h3>
                                                    <div className="mt-4 pt-4 border-t border-blue-100/50 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-xs font-bold text-blue-600">
                                                            {record.doctorId?.name?.[0] || "B"}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-tighter">Bác sĩ điều trị</p>
                                                            <p className="text-sm font-semibold text-[#334155]">{record.doctorId?.name || "Bác sĩ"}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Vitals */}
                                                {record.vitals && (
                                                    <div>
                                                        <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                                                            Chỉ số sinh tồn
                                                        </h3>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl">
                                                                <p className="text-[10px] text-[#94A3B8] font-bold uppercase mb-1">Cân nặng</p>
                                                                <p className="text-lg font-bold text-[#1E293B]">{record.vitals.weight || "--"} <span className="text-xs font-normal">kg</span></p>
                                                            </div>
                                                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl">
                                                                <p className="text-[10px] text-[#94A3B8] font-bold uppercase mb-1">Huyết áp</p>
                                                                <p className="text-lg font-bold text-[#1E293B]">{record.vitals.bloodPressure || "--"} <span className="text-xs font-normal">mmHg</span></p>
                                                            </div>
                                                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl">
                                                                <p className="text-[10px] text-[#94A3B8] font-bold uppercase mb-1">Nhịp tim</p>
                                                                <p className="text-lg font-bold text-[#1E293B]">{record.vitals.heartRate || "--"} <span className="text-xs font-normal">bpm</span></p>
                                                            </div>
                                                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl">
                                                                <p className="text-[10px] text-[#94A3B8] font-bold uppercase mb-1">Nhiệt độ</p>
                                                                <p className="text-lg font-bold text-[#1E293B]">{record.vitals.temperature || "--"} <span className="text-xs font-normal">°C</span></p>
                                                            </div>
                                                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl">
                                                                <p className="text-[10px] text-[#94A3B8] font-bold uppercase mb-1">SpO2</p>
                                                                <p className="text-lg font-bold text-[#1E293B]">{record.vitals.spo2 || "--"} <span className="text-xs font-normal">%</span></p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Prescriptions Integration */}
                                                <div>
                                                    <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-4 flex items-center gap-2">
                                                        <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                                                        Đơn thuốc điều trị
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {record.prescriptions && record.prescriptions.length > 0 ? (
                                                            record.prescriptions.map((p, i) => (
                                                                <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center justify-between group hover:border-blue-200 transition-all">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">💊</div>
                                                                        <div>
                                                                            <p className="font-bold text-[#1E293B] group-hover:text-blue-600 transition-colors">{p.name}</p>
                                                                            <p className="text-xs text-[#64748B]">{p.dosage}</p>
                                                                            {p.instructions && <p className="text-[10px] text-gray-500 italic mt-0.5">{p.instructions}</p>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">{p.duration}</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-[#94A3B8] italic text-center py-4 bg-gray-50 rounded-2xl">Không có đơn thuốc cho hồ sơ này</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Symptoms & Notes parsed */}
                                                {parsedNotes && parsedNotes.history ? (
                                                    <div className="grid grid-cols-1 gap-6 mt-6">
                                                        {/* Legacy format rendering */}
                                                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                                            <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Thăm khám lâm sàng</h4>
                                                            <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                                                                <p><span className="font-semibold text-gray-500">Lý do khám:</span> {parsedNotes.clinical?.reason || "Không ghi nhận"}</p>
                                                                <p><span className="font-semibold text-gray-500">Diễn biến:</span> {parsedNotes.clinical?.progression || "Không ghi nhận"}</p>
                                                                <p><span className="font-semibold text-gray-500">Khám bộ phận:</span> {parsedNotes.clinical?.examination || "Không ghi nhận"}</p>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                                            <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Cận lâm sàng</h4>
                                                            <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                                                                <p><span className="font-semibold text-gray-500">Xét nghiệm:</span> {parsedNotes.paraclinical?.tests || "Không có"}</p>
                                                                <p><span className="font-semibold text-gray-500">Hình ảnh / TDCN:</span> {parsedNotes.paraclinical?.imaging || "Không có"}</p>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                                            <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Phương pháp & Chăm sóc</h4>
                                                            <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                                                                <p><span className="font-semibold text-gray-500">Phương pháp điều trị:</span> {parsedNotes.treatmentMethod || "Không ghi nhận"}</p>
                                                                <p><span className="font-semibold text-gray-500">Hướng dẫn chăm sóc:</span> {parsedNotes.careInstructions || "Không ghi nhận"}</p>
                                                                {parsedNotes.generalNotes && <p><span className="font-semibold text-gray-500">Ghi chú thêm:</span> {parsedNotes.generalNotes}</p>}
                                                            </div>
                                                        </div>

                                                        {(parsedNotes.additionalDocs?.consentForm || parsedNotes.additionalDocs?.IVForm) && (
                                                            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                                                <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Biểu mẫu bổ sung</h4>
                                                                <ul className="list-disc list-inside text-sm text-gray-700 pl-2">
                                                                    {parsedNotes.additionalDocs?.consentForm && <li>Đã có giấy cam kết phẫu thuật/thủ thuật</li>}
                                                                    {parsedNotes.additionalDocs?.IVForm && <li>Đã lập phiếu theo dõi truyền dịch</li>}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-6">
                                                        {record.symptoms && record.symptoms.length > 0 && (
                                                            <div>
                                                                <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Triệu chứng</h3>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {record.symptoms.map((s, i) => (
                                                                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                                                            {s}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        <div>
                                                            <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Ghi chú bác sĩ</h3>
                                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                                                <p className="text-sm text-[#475569] leading-relaxed italic">
                                                                    "{record.notes || "Không có ghi chú thêm"}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
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
