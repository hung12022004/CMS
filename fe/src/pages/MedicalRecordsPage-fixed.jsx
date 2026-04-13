import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getMedicalRecordsApi, createMedicalRecordApi, updateMedicalRecordApi } from "../services/medicalRecord.api";
import { getPatientsApi } from "../services/user.api";
import { updateAppointmentStatusApi } from "../services/appointment.api";
import { updateQueueStatusApi } from "../services/checkin.api";

// Mock medical records - Doctor view
const mockDoctorRecords = [
    {
        id: 1,
        date: "2026-01-20",
        patient: {
            name: "L� Vn C",
            age: 30,
            gender: "Nam",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
        },
        diagnosis: "Vi�m n��u rng m�c � nh�",
        symptoms: ["au rng", "Ch�y m�u n��u", "H�i mi�ng"],
        prescriptions: [
            { name: "Amoxicillin 500mg", dosage: "2 vi�n/ng�y", duration: "7 ng�y" },
            { name: "Paracetamol 500mg", dosage: "Khi au", duration: "Khi c�n" },
        ],
        tests: [
            { name: "X-quang rng", result: "Kh�ng ph�t hi�n s�u rng", file: "xray_dental.pdf" },
        ],
        notes: "T�i kh�m sau 2 tu�n. H��ng d�n b�nh nh�n �nh rng �ng c�ch.",
    },
    {
        id: 2,
        date: "2026-01-10",
        patient: {
            name: "Tr�n Th� D",
            age: 41,
            gender: "N�",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
        },
        diagnosis: "Vi�m da d� �ng c�p t�nh",
        symptoms: ["Ng�a da", "Ph�t ban �", "S�ng nh�"],
        prescriptions: [
            { name: "Loratadine 10mg", dosage: "1 vi�n/ng�y", duration: "14 ng�y" },
            { name: "Hydrocortisone cream 1%", dosage: "B�i 2 l�n/ng�y", duration: "7 ng�y" },
        ],
        tests: [],
        notes: "Tr�nh ti�p x�c v�i ch�t g�y d� �ng. T�i kh�m n�u kh�ng c�i thi�n sau 1 tu�n.",
    },
    {
        id: 3,
        date: "2025-12-15",
        patient: {
            name: "Nguy�n Th� F",
            age: 31,
            gender: "N�",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
        },
        diagnosis: "Tng huy�t �p � 1",
        symptoms: ["au �u", "Ch�ng m�t", "M�t m�i"],
        prescriptions: [
            { name: "Amlodipine 5mg", dosage: "1 vi�n/s�ng", duration: "30 ng�y" },
            { name: "Aspirin 81mg", dosage: "1 vi�n/t�i", duration: "30 ng�y" },
        ],
        tests: [
            { name: "i�n t�m � (ECG)", result: "Nh�p tim b�nh th��ng", file: "ecg_result.pdf" },
            { name: "X�t nghi�m m�u", result: "Cholesterol: 5.2 mmol/L", file: "blood_test.pdf" },
        ],
        notes: "Theo d�i huy�t �p h�ng ng�y. Gi�m mu�i, t�p th� d�c �u �n. T�i kh�m sau 1 th�ng.",
    },
];

// Danh s�ch thu�c, li�u d�ng v� h��ng d�n ph� bi�n (m� ph�ng CSDL)
const COMMON_MEDICINES = [
    "Paracetamol 500mg", "Ibuprofen 400mg", "Amoxicillin 500mg",
    "Azithromycin 500mg", "Loratadine 10mg", "Cetirizine 10mg",
    "Omeprazole 20mg", "Pantoprazole 40mg", "Metformin 500mg",
    "Amlodipine 5mg", "Losartan 50mg", "Vitamin C 500mg",
    "Alpha Choay", "Oresol", "N��c mu�i sinh l� 0.9%"
];

const COMMON_DOSAGES = [
    "1 vi�n/l�n", "2 vi�n/l�n", "1/2 vi�n/l�n",
    "5ml/l�n", "10ml/l�n", "1 g�i/l�n", "1 �ng/l�n"
];

const COMMON_INSTRUCTIONS = [
    "U�ng x 2 l�n/ng�y (S�ng - T�i) sau n",
    "U�ng x 3 l�n/ng�y (S�ng - Tr�a - T�i) sau n",
    "U�ng x 1 l�n/ng�y (S�ng) tr��c n",
    "U�ng khi au/s�t (c�ch nhau 4-6h)",
    "Ng�m d��i l��i",
    "B�i ngo�i da 2 l�n/ng�y"
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
    const [formStatus, setFormStatus] = useState("Ho�n th�nh");
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

    const MEDICINE_LIST = [
        { id: "MED-001", name: "Panadol Extra", unit: "Vi�n" },
        { id: "MED-002", name: "Decolgen", unit: "Vi�n" },
        { id: "MED-003", name: "Augmentin 1g", unit: "Vi�n" },
        { id: "MED-004", name: "Paracetamol 500mg", unit: "Vi�n" },
        { id: "MED-005", name: "Alphachymotrypsin", unit: "Vi�n" },
        { id: "MED-006", name: "Vitamin C 500mg", unit: "Vi�n" },
        { id: "MED-007", name: "Siro Prospan", unit: "Chai" },
        { id: "MED-008", name: "Domperidon 10mg", unit: "Vi�n" }
    ];

    const [formPrescriptionInput, setFormPrescriptionInput] = useState({
        medicine_id: "",
        medicine_name: "",
        dosage_per_time: 1,
        frequency_per_day: 2,
        total_days: 5,
        unit: "Vi�n",
        instruction: "U�ng sau n s�ng/t�i"
    });
    const [formPrescriptions, setFormPrescriptions] = useState([]);

    // Advanced Form State (7 Sections)
    const [formAdminInfo, setFormAdminInfo] = useState({ occupation: "", idCard: "", address: "", relativePhone: "" });
    const [formMedicalMgmt, setFormMedicalMgmt] = useState({ recordNumber: "", objectType: "D�ch v�" });
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
                    // Came from DoctorQueuePage  pre-fill search with patient name
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

    // H�m tr� gi�p parse th�ng tin t� form n�ng cao
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
            setFormPrescriptionInput({ ...formPrescriptionInput, medicine_id: "", medicine_name: medicineName, unit: "Vi�n" });
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
                unit: "Vi�n",
                instruction: "U�ng sau n s�ng/t�i"
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
        setFormStatus(record.status || "Ho�n th�nh");
        setFormVitals(record.vitals || { weight: "", bloodPressure: "", heartRate: "", temperature: "", spo2: "" });
        setFormSymptoms(record.symptoms || []);
        setFormSymptomInput("");
        setFormPrescriptions(record.prescriptions || []);

        const parsedNotes = getParsedNotes(record.notes);
        if (parsedNotes && parsedNotes.anamnesis) {
            setFormAdminInfo(parsedNotes.adminInfo || { occupation: "", idCard: "", address: "", relativePhone: "" });
            setFormMedicalMgmt(parsedNotes.medicalMgmt || { recordNumber: "", objectType: "D�ch v�" });
            setFormAnamnesis(parsedNotes.anamnesis || { reason: "" });
            setFormExamination(parsedNotes.examination || { general: "", parts: "" });
            setFormParaclinical(parsedNotes.paraclinical || { tests: "", imaging: "", endoscopy: "" });
            setFormTreatment(parsedNotes.treatment || { advice: "", followUp: "" });
            setFormNotes(parsedNotes.generalNotes || "");
        } else {
            setFormAdminInfo({ occupation: "", idCard: "", address: "", relativePhone: "" });
            setFormMedicalMgmt({ recordNumber: "", objectType: "D�ch v�" });
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
                diagnosis: formDiagnosis.trim(),
                symptoms: finalSymptoms,
                notes: advancedNotes,
                date: dateStr,
                vitals: formVitals,
                status: formStatus,
                prescriptions: formPrescriptions.map(p => ({
                    name: p.medicine_name || p.name,
                    dosage: p.dosage_per_time ? `${p.dosage_per_time} ${p.unit || 'Vi�n'}` : p.dosage,
                    duration: p.total_days ? `${p.total_days} ng�y` : p.duration,
                    instructions: p.frequency_per_day ? `Ng�y u�ng ${p.frequency_per_day} l�n. T�ng: ${p.total_quantity} ${p.unit || 'Vi�n'}. HD: ${p.instruction || ""}` : (p.instructions || "")
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
                setFormMedicalMgmt({ recordNumber: "", objectType: "D�ch v�" });
                setFormAnamnesis({ reason: "" });
                setFormExamination({ general: "", parts: "" });
                setFormParaclinical({ tests: "", imaging: "", endoscopy: "" });
                setFormTreatment({ advice: "", followUp: "" });
                setShowForm(false);
                setEditRecordId(null);
            }
        } catch (err) {
            console.error("Error saving medical record:", err);
            alert("C� l�i x�y ra khi l�u h� s�");
        }
    };

    // Render for Patient view
    if (!isDoctor) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20 pb-8">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">H� s� b�nh �n</h1>
                        <p className="text-gray-500">L�ch s� kh�m v� k�t qu� i�u tr� c�a b�n</p>
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
                                                    {record.status || "Ho�n th�nh"}
                                                </span>
                                            </div>
                                            {(() => {
                                                const parsed = getParsedNotes(record.notes);
                                                if (parsed && parsed.anamnesis) {
                                                    return (
                                                        <div className="mt-4 space-y-4 mb-4">
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-gray-800 border-b pb-1 mb-2">H�i b�nh & Thm kh�m</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">L� do kh�m:</span> {parsed.anamnesis?.reason}</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">Kh�m b� ph�n:</span> {parsed.examination?.parts}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-gray-800 border-b pb-1 mb-2">i�u tr� & Theo d�i</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">L�i d�n:</span> {parsed.treatment?.advice}</p>
                                                                <p className="text-gray-600"><span className="text-gray-500">H�n t�i kh�m:</span> {parsed.treatment?.followUp}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                } else if (parsed && parsed.history) {
                                                    return (
                                                        <div className="mt-4 space-y-4 mb-4">
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-gray-800 border-b pb-1 mb-2">Thm kh�m l�m s�ng</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">L� do kh�m:</span> {parsed.clinical?.reason}</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">Kh�m b� ph�n:</span> {parsed.clinical?.examination}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-gray-800 border-b pb-1 mb-2">C�n l�m s�ng</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">X�t nghi�m:</span> {parsed.paraclinical?.tests || "Kh�ng c�"}</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">H�nh �nh/TDCN:</span> {parsed.paraclinical?.imaging || "Kh�ng c�"}</p>
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-gray-800 border-b pb-1 mb-2">i�u tr� & Chm s�c</p>
                                                                <p className="text-gray-600 mb-1"><span className="text-gray-500">Ph��ng ph�p:</span> {parsed.treatmentMethod}</p>
                                                                <p className="text-gray-600"><span className="text-gray-500">H��ng d�n:</span> {parsed.careInstructions}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return <p className="text-gray-600 text-sm mb-4">{record.notes}</p>;
                                            })()}
                                            
                                            {record.symptoms && record.symptoms.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                                        <� Tri�u ch�ng:
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
                                                        =� �n thu�c i�u tr�:
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {record.prescriptions.map((p, i) => (
                                                            <div key={i} className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg flex justify-between items-center">
                                                                <div>
                                                                    <span className="font-bold text-blue-600">{p.name}</span>
                                                                    <span className="mx-2 text-gray-400">"</span>
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
                                    <p className="text-gray-500 italic">Ch�a c� h� s� b�nh �n n�o.</p>
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
                        <h2 className="text-xl font-bold text-[#1E293B]">Danh s�ch b�nh nh�n</h2>
                        <span className="w-7 h-7 bg-[#E2E8F0] text-[#475569] text-xs font-bold rounded-full flex items-center justify-center">
                            {patientsList.length}
                        </span>
                    </div>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="T�m t�n, ST, email..."
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
                                        {count} h� s�
                                    </span>
                                    {isDoctor && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedPatientId(patient._id);
                                                setFormPatientId(patient._id);
                                                setFormAppointmentId(null);
                                                setSelectedRecordId(null);
                                                setTimeout(() => setShowForm(true), 50);
                                            }}
                                            className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 rounded-lg border border-gray-100 hover:border-blue-200 transition-all shadow-sm group/btn"
                                            title="T�o nhanh h� s�"
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
            <div className="flex-1 bg-white border-r flex flex-col shadow-sm">
                <div className="p-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-[#1E293B]">L�ch s� kh�m</h2>
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
                            setFormMedicalMgmt({ recordNumber: "", objectType: "D�ch v�" });
                            setFormAnamnesis({ reason: "" });
                            setFormExamination({ general: "", parts: "" });
                            setFormParaclinical({ tests: "", imaging: "", endoscopy: "" });
                            setFormTreatment({ advice: "", followUp: "" });
                            setShowForm(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        + Th�m h� s�
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
                        placeholder="T�m theo ch�n o�n, ghi ch�..."
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
                                                    {record.status || "Ho�n th�nh"}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-[#334155] text-base mb-1">{record.diagnosis}</h3>
                                            <p className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                                                BS: {record.doctorId?.name || "BS. Nguy�n Vn A"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {patientRecords.length === 0 && (
                                    <div className="text-center py-10 opacity-50">
                                        <p className="text-sm">B�nh nh�n ch�a c� l�ch s� kh�m.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] pb-10">
                            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p className="font-medium">Ch�n m�t b�nh nh�n � xem l�ch s� kh�m</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Record Detail OR Form */}
            <div className={`w-[600px] bg-white border-l transition-all duration-300 flex flex-col shadow-xl ${(showForm || selectedRecordId) ? "mr-0" : "-mr-[600px]"}`}>
                {showForm ? (
                    <>
                        {/* Professional form header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-1">Ph�u kh�m b�nh</p>
                                    <h2 className="text-xl font-bold">T�o h� s� b�nh �n</h2>
                                    {selectedPatient && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{selectedPatient.name[0]}</div>
                                            <span className="text-sm text-blue-100 font-medium">{selectedPatient.name}</span>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white/80 hover:text-white transition">
                                    
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 bg-[#F8FAFC]">
                            {/* I. H�nh ch�nh */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">I. H�nh ch�nh</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div><span className="text-gray-500 block text-xs mb-1">H� t�n</span> <span className="font-semibold text-gray-900">{selectedPatient?.name}</span></div>
                                    <div><span className="text-gray-500 block text-xs mb-1">Gi�i t�nh</span> <span className="font-semibold text-gray-900">{selectedPatient?.gender === "male" ? "Nam" : selectedPatient?.gender === "female" ? "N�" : "Kh�c"}</span></div>
                                    <div><span className="text-gray-500 block text-xs mb-1">Ng�y sinh</span> <span className="font-semibold text-gray-900">{"Ch�a c�p nh�t"}</span></div>
                                    <div><span className="text-gray-500 block text-xs mb-1">ST BN</span> <span className="font-semibold text-gray-900">{selectedPatient?.phoneNumber || "Ch�a c�p nh�t"}</span></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Ngh� nghi�p</label>
                                        <input type="text" value={formAdminInfo.occupation} onChange={e => setFormAdminInfo({...formAdminInfo, occupation: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">S� CCCD</label>
                                        <input type="text" value={formAdminInfo.idCard} onChange={e => setFormAdminInfo({...formAdminInfo, idCard: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">�a ch�</label>
                                        <input type="text" value={formAdminInfo.address} onChange={e => setFormAdminInfo({...formAdminInfo, address: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">ST ng��i th�n (khi c�n)</label>
                                        <input type="text" value={formAdminInfo.relativePhone} onChange={e => setFormAdminInfo({...formAdminInfo, relativePhone: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Vitals */}
                            <div>
                                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-3">=� Ch� s� c� b�n (Vitals)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <input type="text" placeholder="C�n n�ng" value={formVitals.weight} onChange={e => setFormVitals({ ...formVitals, weight: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none" />
                                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">kg</span>
                                    </div>
                                    <div className="relative">
                                        <input type="text" placeholder="Huy�t �p" value={formVitals.bloodPressure} onChange={e => setFormVitals({ ...formVitals, bloodPressure: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none" />
                                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">mmHg</span>
                                    </div>
                                    <div className="relative">
                                        <input type="text" placeholder="Nh�p tim" value={formVitals.heartRate} onChange={e => setFormVitals({ ...formVitals, heartRate: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none" />
                                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">bpm</span>
                                    </div>
                                    <div className="relative">
                                        <input type="text" placeholder="Nhi�t �" value={formVitals.temperature} onChange={e => setFormVitals({ ...formVitals, temperature: e.target.value })} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none" />
                                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">�C</span>
                                    </div>
                                </div>
                            </div>

                            {/* II. Qu�n l� ng��i b�nh */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">II. Qu�n l� ng��i b�nh</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">M� h� s� (Tu� ch�n)</label>
                                        <input type="text" value={formMedicalMgmt.recordNumber} onChange={e => setFormMedicalMgmt({...formMedicalMgmt, recordNumber: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">�i t��ng kh�m</label>
                                        <select value={formMedicalMgmt.objectType} onChange={e => setFormMedicalMgmt({...formMedicalMgmt, objectType: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none">
                                            <option value="D�ch v�">D�ch v�</option>
                                            <option value="BHYT">BHYT</option>
                                            <option value="Kh�m s�c kh�e">Kh�m s�c kh�e</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* III. L� do kh�m & B�nh s� */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">III. H�i b�nh</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">1. L� do kh�m b�nh / B�nh s�</label>
                                        <textarea value={formAnamnesis.reason} onChange={e => setFormAnamnesis({...formAnamnesis, reason: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400" placeholder="Tri�u ch�ng ch�nh khi�n b�nh nh�n i kh�m..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-2">2. C�c Tri�u ch�ng c� th� (H� tr� ch�n o�n)</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={formSymptomInput}
                                                onChange={e => setFormSymptomInput(e.target.value)}
                                                onKeyDown={handleSymptomKeyDown}
                                                placeholder="Nh�p tri�u ch�ng r�i Enter..."
                                                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button onClick={addSymptom} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition">+</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formSymptoms.map((s, i) => (
                                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                                                    {s}
                                                    <button onClick={() => removeSymptom(i)} className="text-blue-400 hover:text-red-500 transition"></button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* IV. Kh�m b�nh */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">IV. Kh�m b�nh</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">1. Kh�m To�n th�n</label>
                                        <textarea value={formExamination.general} onChange={e => setFormExamination({...formExamination, general: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400" placeholder="Da ni�m m�c, h�ch b�ch huy�t, tuy�n gi�p..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">2. Kh�m B� ph�n</label>
                                        <textarea value={formExamination.parts} onChange={e => setFormExamination({...formExamination, parts: e.target.value})} rows={3} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400" placeholder="Tim m�ch, h� h�p, ti�u ho�..." />
                                    </div>
                                </div>
                            </div>
                            
                            {/* V. C�n l�m s�ng */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">V. C�n l�m s�ng</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">1. X�t nghi�m</label>
                                        <textarea value={formParaclinical.tests} onChange={e => setFormParaclinical({...formParaclinical, tests: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400" placeholder="Huy�t h�c, Sinh ho� m�y..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">2. Ch�n o�n h�nh �nh</label>
                                        <textarea value={formParaclinical.imaging} onChange={e => setFormParaclinical({...formParaclinical, imaging: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400" placeholder="Si�u �m, X-quang, MRI..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">3. Thm d� ch�c nng / N�i soi</label>
                                        <textarea value={formParaclinical.endoscopy} onChange={e => setFormParaclinical({...formParaclinical, endoscopy: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400" placeholder="N�i soi TMH, d� d�y, o h� h�p..." />
                                    </div>
                                </div>
                            </div>

                            {/* VI. T�ng k�t b�nh */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">VI. T�ng k�t b�nh</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">Ch�n o�n b�nh (*)</label>
                                        <input
                                            type="text"
                                            value={formDiagnosis}
                                            onChange={e => setFormDiagnosis(e.target.value)}
                                            placeholder="Nh�p ch�n o�n x�c �nh..."
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-1">Tr�ng th�i h� s�</label>
                                            <select
                                                value={formStatus}
                                                onChange={e => setFormStatus(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="Ho�n th�nh">Ho�n th�nh</option>
                                                <option value="ang i�u tr�">ang i�u tr�</option>
                                                <option value="Ch� k�t qu�">Ch� k�t qu�</option>
                                                <option value="Chuy�n vi�n">Chuy�n vi�n</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* VII. i�u tr� & Theo d�i */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">VII. i�u tr� & Theo d�i</h3>
                                
                                <div className="space-y-4">
                                    {/* 1. �n thu�c */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-2">1. �n thu�c th�ng minh</label>
                                        <div className="space-y-3 mb-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] text-gray-500 uppercase font-bold">T�n thu�c</label>
                                                <input
                                                    type="text"
                                                    list="medicine-list"
                                                    autoComplete="off"
                                                    placeholder="G� ho�c ch�n t�n thu�c..."
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
                                                    <label className="text-[10px] text-gray-500 uppercase font-bold">M�i l�n</label>
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
                                                    <label className="text-[10px] text-gray-500 uppercase font-bold">T�n su�t</label>
                                                    <select
                                                        value={formPrescriptionInput.frequency_per_day}
                                                        onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, frequency_per_day: Number(e.target.value) })}
                                                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value={1}>1 l�n/ng�y</option>
                                                        <option value={2}>2 l�n/ng�y</option>
                                                        <option value={3}>3 l�n/ng�y</option>
                                                        <option value={4}>4 l�n/ng�y</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] text-gray-500 uppercase font-bold">S� ng�y</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={formPrescriptionInput.total_days}
                                                            onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, total_days: Number(e.target.value) })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10"
                                                        />
                                                        <span className="absolute right-3 top-2 text-sm text-gray-400">ng�y</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] text-gray-500 uppercase font-bold">H��ng d�n th�m</label>
                                                <input
                                                    type="text"
                                                    value={formPrescriptionInput.instruction}
                                                    onChange={e => setFormPrescriptionInput({ ...formPrescriptionInput, instruction: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="V� d�: U�ng sau n s�ng/t�i"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                                <span className="text-xs text-gray-600 font-medium">T�ng c�ng:</span>
                                                <span className="text-sm font-bold text-blue-700">
                                                    {formPrescriptionInput.dosage_per_time * formPrescriptionInput.frequency_per_day * formPrescriptionInput.total_days} {formPrescriptionInput.unit}
                                                </span>
                                            </div>

                                            <button
                                                onClick={addPrescription}
                                                type="button"
                                                className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                                            >
                                                + Th�m thu�c v�o �n
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {formPrescriptions.map((p, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-xl shadow-sm">
                                                    <div className="flex flex-1 items-start gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600">=�</div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <p className="text-sm font-bold text-gray-800">{p.medicine_name || p.name}</p>
                                                                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                                                    T�NG: {p.total_quantity || "N/A"} {p.unit || "Vi�n"}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 font-medium">
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded">M�i l�n {p.dosage_per_time} {p.unit}</span>
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded">{p.frequency_per_day} l�n/ng�y</span>
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded">Trong {p.total_days} ng�y</span>
                                                            </div>
                                                            <p className="text-[11px] text-gray-400 mt-1 italic">HD: {p.instruction}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removePrescription(i)} className="p-2 ml-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition"></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. L�i d�n */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 block mb-1">2. L�i d�n b�c s)</label>
                                        <textarea value={formTreatment.advice} onChange={e => setFormTreatment({...formTreatment, advice: e.target.value})} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-400" placeholder="Ch� � n u�ng, sinh ho�t, t�p luy�n..." />
                                    </div>


                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">=� Ghi ch� & H��ng d�n</label>
                                <textarea
                                    value={formNotes}
                                    onChange={e => setFormNotes(e.target.value)}
                                    placeholder="Nh�p ghi ch� i�u tr�, h��ng d�n t�i kh�m..."
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
                                 L�u h� s� b�nh �n
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
                                        <h2 className="text-xl font-bold text-[#1E293B]">Chi ti�t h� s�</h2>
                                        <p className="text-xs text-[#64748B] mt-1">{formatDate(record.date)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {record.status !== "Ho�n th�nh" && (
                                            <button 
                                                onClick={() => handleEditRecord(record)} 
                                                className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition"
                                            >
                                                 S�a h� s�
                                            </button>
                                        )}
                                        <button onClick={() => setSelectedRecordId(null)} className="text-[#94A3B8] hover:text-[#475569] text-sm flex items-center gap-1">
                                             �ng
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 bg-[#F8FAFC]">
                                    {(() => {
                                        const parsedNotes = getParsedNotes(record.notes);
                                        
                                        if (parsedNotes && parsedNotes.anamnesis) {
                                            return (
                                                <>
                                                    {/* I. H�nh ch�nh */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">I. H�nh ch�nh</h3>
                                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                            <div><span className="text-gray-500 block text-xs mb-1">H� t�n</span> <span className="font-semibold text-gray-900">{record.patientId?.name || "B�nh nh�n"}</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">Gi�i t�nh</span> <span className="font-semibold text-gray-900">{record.patientId?.gender === "male" ? "Nam" : record.patientId?.gender === "female" ? "N�" : "Kh�c"}</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">Ng�y sinh</span> <span className="font-semibold text-gray-900">Ch�a c�p nh�t</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">ST BN</span> <span className="font-semibold text-gray-900">{record.patientId?.phoneNumber || "Ch�a c�p nh�t"}</span></div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-4">
                                                            <div><span className="text-gray-500 block text-xs mb-1">Ngh� nghi�p</span> <span className="font-semibold text-gray-900">{parsedNotes.adminInfo?.occupation || ""}</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">S� CCCD</span> <span className="font-semibold text-gray-900">{parsedNotes.adminInfo?.idCard || ""}</span></div>
                                                            <div className="col-span-2"><span className="text-gray-500 block text-xs mb-1">�a ch�</span> <span className="font-semibold text-gray-900">{parsedNotes.adminInfo?.address || ""}</span></div>
                                                            <div className="col-span-2"><span className="text-gray-500 block text-xs mb-1">ST ng��i th�n (khi c�n)</span> <span className="font-semibold text-gray-900">{parsedNotes.adminInfo?.relativePhone || ""}</span></div>
                                                        </div>
                                                    </div>

                                                    {/* II. Qu�n l� y t� */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">II. Qu�n l� y t�</h3>
                                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                            <div><span className="text-gray-500 block text-xs mb-1">M� s� b�nh nh�n (ID)</span> <span className="font-semibold text-gray-900">{record.patientId?._id ? record.patientId._id.substring(0, 8) + "..." : ""}</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">Ng�y gi� kh�m</span> <span className="font-semibold text-gray-900">{formatDate(record.date)}</span></div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-4">
                                                            <div><span className="text-gray-500 block text-xs mb-1">S� h� s�</span> <span className="font-semibold text-gray-900">{parsedNotes.medicalMgmt?.recordNumber || ""}</span></div>
                                                            <div><span className="text-gray-500 block text-xs mb-1">�i t��ng</span> <span className="font-semibold text-gray-900">{parsedNotes.medicalMgmt?.objectType || "D�ch v�"}</span></div>
                                                        </div>
                                                    </div>

                                                    {/* III. H�i b�nh */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">III. H�i b�nh</h3>
                                                        <div className="text-sm">
                                                            <span className="text-gray-500 block text-xs mb-1">L� do �n kh�m</span> 
                                                            <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.anamnesis?.reason || ""}</p>
                                                        </div>
                                                    </div>

                                                    {/* IV. Thm kh�m */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">IV. Thm kh�m</h3>
                                                        <div className="space-y-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">1. T�nh tr�ng</span> 
                                                                <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.examination?.general || ""}</p>
                                                            </div>
                                                            
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-2">2. Ch� s� sinh t�n</span>
                                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-gray-500 text-[10px] uppercase font-bold block mb-1">M�ch</span><span className="font-bold text-gray-900">{record.vitals?.heartRate || ""} <span className="text-xs font-normal text-gray-500">l�n/ph�t</span></span></div>
                                                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-gray-500 text-[10px] uppercase font-bold block mb-1">HA</span><span className="font-bold text-gray-900">{record.vitals?.bloodPressure || ""} <span className="text-xs font-normal text-gray-500">mmHg</span></span></div>
                                                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-gray-500 text-[10px] uppercase font-bold block mb-1">Nhi�t �</span><span className="font-bold text-gray-900">{record.vitals?.temperature || ""} <span className="text-xs font-normal text-gray-500">�C</span></span></div>
                                                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-gray-500 text-[10px] uppercase font-bold block mb-1">SpO2</span><span className="font-bold text-gray-900">{record.vitals?.spo2 || ""} <span className="text-xs font-normal text-gray-500">%</span></span></div>
                                                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-gray-500 text-[10px] uppercase font-bold block mb-1">C�n n�ng</span><span className="font-bold text-gray-900">{record.vitals?.weight || ""} <span className="text-xs font-normal text-gray-500">kg</span></span></div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">3. Kh�m b� ph�n</span> 
                                                                <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.examination?.parts || ""}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* V. C�n l�m s�ng */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">V. C�n l�m s�ng</h3>
                                                        <div className="space-y-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">X�t nghi�m (M�u, n��c ti�u...)</span> 
                                                                <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.paraclinical?.tests || ""}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">Ch�n o�n h�nh �nh</span> 
                                                                <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.paraclinical?.imaging || ""}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">N�i soi</span> 
                                                                <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.paraclinical?.endoscopy || ""}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* VI. T�ng k�t b�nh */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">VI. T�ng k�t b�nh</h3>
                                                        <div className="space-y-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">Ch�n o�n b�nh</span> 
                                                                <p className="font-bold text-gray-900 text-lg text-blue-700">{record.diagnosis}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">Tr�ng th�i h� s�</span> 
                                                                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200 uppercase">{record.status || "Ho�n th�nh"}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-2">Tri�u ch�ng n�i b�t (Tags)</span> 
                                                                <div className="flex flex-wrap gap-2">
                                                                    {record.symptoms?.length > 0 ? record.symptoms.map((s, i) => (
                                                                        <span key={i} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                            {s}
                                                                        </span>
                                                                    )) : <span className="text-gray-900 font-semibold"></span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* VII. i�u tr� & Theo d�i */}
                                                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">VII. i�u tr� & Theo d�i</h3>
                                                        <div className="space-y-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-2">1. �n thu�c</span> 
                                                                {record.prescriptions && record.prescriptions.length > 0 ? (
                                                                    <div className="space-y-2">
                                                                        {parsedNotes.prescriptionItems && parsedNotes.prescriptionItems.length > 0 ? parsedNotes.prescriptionItems.map((p, i) => (
                                                                            <div key={i} className="flex items-start p-3 bg-gray-50 border border-blue-100 rounded-xl">
                                                                                <div className="flex-1">
                                                                                    <div className="flex justify-between items-center mb-1">
                                                                                        <p className="text-sm font-bold text-gray-800">{p.medicine_name}</p>
                                                                                        <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">T�ng: {p.total_quantity} {p.unit}</span>
                                                                                    </div>
                                                                                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                                                                                        <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded">M�i l�n: {p.dosage_per_time} {p.unit}</span>
                                                                                        <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded">{p.frequency_per_day} l�n/ng�y</span>
                                                                                        <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded">{p.total_days} ng�y</span>
                                                                                    </div>
                                                                                    <p className="text-[11px] text-gray-600 mt-1 italic whitespace-pre-wrap">{p.instruction}</p>
                                                                                </div>
                                                                            </div>
                                                                        )) : record.prescriptions.map((p, i) => (
                                                                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                                                                <div className="flex-1">
                                                                                    <p className="text-sm font-bold text-gray-800">{p.name}</p>
                                                                                    <p className="text-[11px] text-gray-500">{p.dosage} " {p.duration}</p>
                                                                                    {p.instructions && <p className="text-[11px] text-gray-500 italic">HD: {p.instructions}</p>}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="font-semibold text-gray-900"></p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">2. L�i d�n b�c s)</span> 
                                                                <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.treatment?.advice || ""}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block text-xs mb-1">3. H�n t�i kh�m</span> 
                                                                <p className="font-semibold text-gray-900 whitespace-pre-wrap">{parsedNotes.treatment?.followUp || ""}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        }
                                        
                                        // Fallback cho �nh d�ng h� s� ci (Legacy)
                                        return (
                                            <div className="space-y-8">
                                                {/* Diagnosis & Status */}
                                                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Ch�n o�n</span>
                                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">
                                                            {record.status || "Ho�n th�nh"}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-[#1E293B] leading-tight">{record.diagnosis}</h3>
                                                    <div className="mt-4 pt-4 border-t border-blue-100/50 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-xs font-bold text-blue-600">
                                                            {record.doctorId?.name?.[0] || "B"}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-tighter">B�c s) i�u tr�</p>
                                                            <p className="text-sm font-semibold text-[#334155]">{record.doctorId?.name || "B�c s)"}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Vitals */}
                                                {record.vitals && (
                                                    <div>
                                                        <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                                                            Ch� s� sinh t�n
                                                        </h3>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl">
                                                                <p className="text-[10px] text-[#94A3B8] font-bold uppercase mb-1">C�n n�ng</p>
                                                                <p className="text-lg font-bold text-[#1E293B]">{record.vitals.weight || "--"} <span className="text-xs font-normal">kg</span></p>
                                                            </div>
                                                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl">
                                                                <p className="text-[10px] text-[#94A3B8] font-bold uppercase mb-1">Huy�t �p</p>
                                                                <p className="text-lg font-bold text-[#1E293B]">{record.vitals.bloodPressure || "--"} <span className="text-xs font-normal">mmHg</span></p>
                                                            </div>
                                                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl">
                                                                <p className="text-[10px] text-[#94A3B8] font-bold uppercase mb-1">Nh�p tim</p>
                                                                <p className="text-lg font-bold text-[#1E293B]">{record.vitals.heartRate || "--"} <span className="text-xs font-normal">bpm</span></p>
                                                            </div>
                                                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl">
                                                                <p className="text-[10px] text-[#94A3B8] font-bold uppercase mb-1">Nhi�t �</p>
                                                                <p className="text-lg font-bold text-[#1E293B]">{record.vitals.temperature || "--"} <span className="text-xs font-normal">�C</span></p>
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
                                                        �n thu�c i�u tr�
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {record.prescriptions && record.prescriptions.length > 0 ? (
                                                            record.prescriptions.map((p, i) => (
                                                                <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center justify-between group hover:border-blue-200 transition-all">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">=�</div>
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
                                                            <p className="text-sm text-[#94A3B8] italic text-center py-4 bg-gray-50 rounded-2xl">Kh�ng c� �n thu�c cho h� s� n�y</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Symptoms & Notes parsed */}
                                                {parsedNotes && parsedNotes.history ? (
                                                    <div className="grid grid-cols-1 gap-6 mt-6">
                                                        {/* Legacy format rendering */}
                                                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                                            <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Thm kh�m l�m s�ng</h4>
                                                            <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                                                                <p><span className="font-semibold text-gray-500">L� do kh�m:</span> {parsedNotes.clinical?.reason || "Kh�ng ghi nh�n"}</p>
                                                                <p><span className="font-semibold text-gray-500">Di�n bi�n:</span> {parsedNotes.clinical?.progression || "Kh�ng ghi nh�n"}</p>
                                                                <p><span className="font-semibold text-gray-500">Kh�m b� ph�n:</span> {parsedNotes.clinical?.examination || "Kh�ng ghi nh�n"}</p>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                                            <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">C�n l�m s�ng</h4>
                                                            <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                                                                <p><span className="font-semibold text-gray-500">X�t nghi�m:</span> {parsedNotes.paraclinical?.tests || "Kh�ng c�"}</p>
                                                                <p><span className="font-semibold text-gray-500">H�nh �nh / TDCN:</span> {parsedNotes.paraclinical?.imaging || "Kh�ng c�"}</p>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                                            <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Ph��ng ph�p & Chm s�c</h4>
                                                            <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                                                                <p><span className="font-semibold text-gray-500">Ph��ng ph�p i�u tr�:</span> {parsedNotes.treatmentMethod || "Kh�ng ghi nh�n"}</p>
                                                                <p><span className="font-semibold text-gray-500">H��ng d�n chm s�c:</span> {parsedNotes.careInstructions || "Kh�ng ghi nh�n"}</p>
                                                                {parsedNotes.generalNotes && <p><span className="font-semibold text-gray-500">Ghi ch� th�m:</span> {parsedNotes.generalNotes}</p>}
                                                            </div>
                                                        </div>

                                                        {(parsedNotes.additionalDocs?.consentForm || parsedNotes.additionalDocs?.IVForm) && (
                                                            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                                                <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Bi�u m�u b� sung</h4>
                                                                <ul className="list-disc list-inside text-sm text-gray-700 pl-2">
                                                                    {parsedNotes.additionalDocs?.consentForm && <li>� c� gi�y cam k�t ph�u thu�t/th� thu�t</li>}
                                                                    {parsedNotes.additionalDocs?.IVForm && <li>� l�p phi�u theo d�i truy�n d�ch</li>}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-6">
                                                        {record.symptoms && record.symptoms.length > 0 && (
                                                            <div>
                                                                <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Tri�u ch�ng</h3>
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
                                                            <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Ghi ch� b�c s)</h3>
                                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                                                <p className="text-sm text-[#475569] leading-relaxed italic">
                                                                    "{record.notes || "Kh�ng c� ghi ch� th�m"}"
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
                            <span className="text-4xl translate-y-1">=�</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#1E293B] mb-2">Chi ti�t h� s� b�nh �n</h3>
                        <p className="text-sm text-[#64748B] max-w-[250px]">
                            Ch�n m�t m�c th�i gian t� l�ch s� kh�m � xem th�ng tin chi ti�t v� �n thu�c.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
