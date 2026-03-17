import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getPatientsApi } from "../services/user.api";

// Mock prescriptions data - Doctor view
const mockDoctorPrescriptions = [
    {
        id: 1,
        prescribedDate: "2026-01-20",
        patient: "Lê Văn C",
        isActive: true,
        medicines: [
            {
                id: 1,
                name: "Amoxicillin 500mg",
                type: "capsule",
                color: "red-yellow",
                dosage: { morning: 1, noon: 0, evening: 1 },
                instructions: "Uống sau ăn",
                quantity: 14,
                remaining: 6,
                duration: "7 ngày",
            },
            {
                id: 2,
                name: "Paracetamol 500mg",
                type: "tablet",
                color: "white",
                dosage: { morning: 0, noon: 0, evening: 0, asNeeded: true },
                instructions: "Uống khi đau, tối đa 4 viên/ngày",
                quantity: 10,
                remaining: 8,
                duration: "Khi cần",
            },
        ],
    },
    {
        id: 2,
        prescribedDate: "2026-01-10",
        patient: "Trần Thị D",
        isActive: true,
        medicines: [
            {
                id: 3,
                name: "Loratadine 10mg",
                type: "tablet",
                color: "white",
                dosage: { morning: 1, noon: 0, evening: 0 },
                instructions: "Uống trước bữa sáng",
                quantity: 14,
                remaining: 4,
                duration: "14 ngày",
            },
        ],
    },
];

// Medicine type icons
const getMedicineIcon = (type) => {
    switch (type) {
        case "capsule": return "💊";
        case "tablet": return "⚪";
        case "cream": return "🧴";
        case "syrup": return "🍯";
        case "injection": return "💉";
        default: return "💊";
    }
};

const EMPTY_MED = { name: "", type: "tablet", dosage: { morning: 0, noon: 0, evening: 0 }, instructions: "", quantity: "", duration: "" };

export default function PrescriptionsPage() {
    const { user } = useAuth();
    const location = useLocation();
    const [expandedId, setExpandedId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formPatientId, setFormPatientId] = useState("");
    const [formMeds, setFormMeds] = useState([{ ...EMPTY_MED }]);

    // Danh sách bệnh nhân đã đăng ký
    const [patientsList, setPatientsList] = useState([]);

    const isDoctor = user?.role === "doctor";
    const isStaff = user?.role === "doctor" || user?.role === "nurse" || user?.role === "admin";

    // Fetch patients from API
    useEffect(() => {
        if (isDoctor) {
            getPatientsApi()
                .then((data) => {
                    setPatientsList(data.patients || []);
                    // Check if we came from Appointments with a patient
                    if (location.state?.patientId) {
                        setFormPatientId(location.state.patientId);
                        setShowForm(true);
                        // Optional: clear state to prevent re-opening on refresh
                        window.history.replaceState({}, document.title);
                    }
                })
                .catch(() => setPatientsList([]));
        }
    }, [isDoctor, location.state]);

    // Read from localStorage
    const [savedPrescriptions, setSavedPrescriptions] = useState([]);
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("cms_prescriptions") || "[]");
        setSavedPrescriptions(stored);
    }, []);

    // Merge mock + saved
    const allPrescriptions = isStaff
        ? [...savedPrescriptions, ...mockDoctorPrescriptions]
        : savedPrescriptions;

    const prescriptions = isStaff
        ? allPrescriptions
        : allPrescriptions.filter(p => p.patientEmail === user?.email || p.patient === user?.name);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
    };

    const getDosageDisplay = (dosage = {}) => {
        const parts = [];
        if (dosage.morning > 0) parts.push({ time: "Sáng", count: dosage.morning, icon: "🌅" });
        if (dosage.noon > 0) parts.push({ time: "Trưa", count: dosage.noon, icon: "☀️" });
        if (dosage.evening > 0) parts.push({ time: "Tối", count: dosage.evening, icon: "🌙" });
        if (dosage.asNeeded) parts.push({ time: "Khi cần", count: 1, icon: "⏰" });
        return parts;
    };

    const getStockStatus = (remaining, total) => {
        if (remaining === 0) return { text: "Hết thuốc", bg: "bg-gray-100", textColor: "text-gray-500", progress: 0 };
        const pct = (remaining / total) * 100;
        if (pct <= 25) return { text: "Sắp hết", bg: "bg-amber-100", textColor: "text-amber-700", progress: pct };
        return { text: "Còn thuốc", bg: "bg-emerald-100", textColor: "text-emerald-700", progress: pct };
    };

    // --- Filter by Medical Record Context ---
    const filterContext = location.state || {}; // { medicalRecordId, patientId, patientName }
    const filteredPrescriptions = filterContext.patientName
        ? prescriptions.filter(p => p.patient === filterContext.patientName || p.patientEmail === filterContext.patientName)
        : prescriptions;

    // --- Editing State (Doctor Only) ---
    const [editingMedId, setEditingMedId] = useState(null);
    const [editMedForm, setEditMedForm] = useState(null);

    const startEditMed = (medicine) => {
        setEditingMedId(medicine.id);
        setEditMedForm({ ...medicine });
    };

    const cancelEditMed = () => {
        setEditingMedId(null);
        setEditMedForm(null);
    };

    const handleSaveEditMed = (prescriptionId) => {
        if (!editMedForm) return;

        // Update in localStorage
        const stored = JSON.parse(localStorage.getItem("cms_prescriptions") || "[]");
        const pIndex = stored.findIndex(p => p.id === prescriptionId);
        
        if (pIndex !== -1) {
            const mIndex = stored[pIndex].medicines.findIndex(m => m.id === editingMedId);
            if (mIndex !== -1) {
                // Ensure quantity updates remaining intelligently
                const qtyDiff = editMedForm.quantity - stored[pIndex].medicines[mIndex].quantity;
                stored[pIndex].medicines[mIndex] = {
                    ...editMedForm,
                    remaining: Math.max(0, stored[pIndex].medicines[mIndex].remaining + qtyDiff)
                };
                
                localStorage.setItem("cms_prescriptions", JSON.stringify(stored));
                setSavedPrescriptions(stored);
            }
        }
        
        cancelEditMed();
    };

    const updateEditField = (field, value) => setEditMedForm(prev => ({ ...prev, [field]: value }));
    const updateEditDosage = (timeKey, value) => {
        setEditMedForm(prev => ({
            ...prev,
            dosage: { ...prev.dosage, [timeKey]: Number(value) || 0 }
        }));
    };
    const addMedicine = () => setFormMeds([...formMeds, { ...EMPTY_MED }]);

    const removeMedicine = (idx) => {
        if (formMeds.length > 1) setFormMeds(formMeds.filter((_, i) => i !== idx));
    };

    const updateMed = (idx, field, value) => {
        setFormMeds(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
    };

    const updateDosage = (idx, timeKey, value) => {
        setFormMeds(prev => prev.map((m, i) =>
            i === idx ? { ...m, dosage: { ...m.dosage, [timeKey]: Number(value) || 0 } } : m
        ));
    };

    const handleSavePrescription = () => {
        const selectedPatient = patientsList.find(p => p._id === formPatientId);
        if (!selectedPatient || formMeds.every(m => !m.name.trim())) return;

        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        const newPrescription = {
            id: Date.now(),
            prescribedDate: dateStr,
            patient: selectedPatient.name,
            patientEmail: selectedPatient.email,
            doctor: user?.name || "Bác sĩ",
            isActive: true,
            medicines: formMeds
                .filter(m => m.name.trim())
                .map((m, i) => ({
                    id: Date.now() + i,
                    name: m.name.trim(),
                    type: m.type,
                    color: "white",
                    dosage: m.dosage,
                    instructions: m.instructions,
                    quantity: Number(m.quantity) || 0,
                    remaining: Number(m.quantity) || 0,
                    duration: m.duration,
                })),
        };

        const stored = JSON.parse(localStorage.getItem("cms_prescriptions") || "[]");
        stored.unshift(newPrescription);
        localStorage.setItem("cms_prescriptions", JSON.stringify(stored));
        setSavedPrescriptions(stored);

        // Reset form
        setFormPatientId("");
        setFormMeds([{ ...EMPTY_MED }]);
        setShowForm(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            {isStaff ? "Quản lý đơn thuốc" : "Đơn thuốc của tôi"}
                        </h1>
                        <p className="text-gray-500">
                            {filterContext.patientName 
                                ? `Đang xem đơn thuốc của: ${filterContext.patientName}` 
                                : isStaff ? "Tất cả đơn thuốc" : "Theo dõi và quản lý đơn thuốc"}
                        </p>
                    </div>
                    {isDoctor && !filterContext.patientName && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
                        >
                            {showForm ? "✕ Đóng" : "+ Kê đơn mới"}
                        </button>
                    )}
                </div>

                {/* ========== NEW PRESCRIPTION FORM ========== */}
                {showForm && isDoctor && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-blue-200 animate-fade-in">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            📝 Kê đơn thuốc mới
                        </h2>

                        {/* Patient Select Dropdown */}
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
                                        {p.name} ({p.email})
                                    </option>
                                ))}
                            </select>
                            {patientsList.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">Chưa có bệnh nhân nào đăng ký tài khoản</p>
                            )}
                        </div>

                        {/* Medicines List */}
                        <div className="space-y-4">
                            {formMeds.map((med, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold text-gray-700">💊 Thuốc {idx + 1}</h4>
                                        {formMeds.length > 1 && (
                                            <button
                                                onClick={() => removeMedicine(idx)}
                                                className="text-xs text-red-500 hover:text-red-700"
                                            >
                                                ✕ Xóa
                                            </button>
                                        )}
                                    </div>

                                    {/* Medicine Name + Type */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="text-xs text-gray-500">Tên thuốc *</label>
                                            <input
                                                type="text"
                                                value={med.name}
                                                onChange={e => updateMed(idx, "name", e.target.value)}
                                                placeholder="VD: Amoxicillin 500mg"
                                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Loại</label>
                                            <select
                                                value={med.type}
                                                onChange={e => updateMed(idx, "type", e.target.value)}
                                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400"
                                            >
                                                <option value="tablet">Viên nén</option>
                                                <option value="capsule">Viên nang</option>
                                                <option value="cream">Kem bôi</option>
                                                <option value="syrup">Siro</option>
                                                <option value="injection">Tiêm</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Dosage */}
                                    <div className="mb-3">
                                        <label className="text-xs text-gray-500">Liều dùng (viên/lần)</label>
                                        <div className="grid grid-cols-3 gap-2 mt-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">🌅</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={med.dosage.morning}
                                                    onChange={e => updateDosage(idx, "morning", e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center text-gray-900 bg-white focus:outline-none focus:border-blue-400"
                                                    placeholder="Sáng"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">☀️</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={med.dosage.noon}
                                                    onChange={e => updateDosage(idx, "noon", e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center text-gray-900 bg-white focus:outline-none focus:border-blue-400"
                                                    placeholder="Trưa"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">🌙</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={med.dosage.evening}
                                                    onChange={e => updateDosage(idx, "evening", e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center text-gray-900 bg-white focus:outline-none focus:border-blue-400"
                                                    placeholder="Tối"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Instructions, Quantity, Duration */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500">Hướng dẫn</label>
                                            <input
                                                type="text"
                                                value={med.instructions}
                                                onChange={e => updateMed(idx, "instructions", e.target.value)}
                                                placeholder="VD: Uống sau ăn"
                                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Số lượng</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={med.quantity}
                                                onChange={e => updateMed(idx, "quantity", e.target.value)}
                                                placeholder="14"
                                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Thời gian</label>
                                            <input
                                                type="text"
                                                value={med.duration}
                                                onChange={e => updateMed(idx, "duration", e.target.value)}
                                                placeholder="VD: 7 ngày"
                                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Medicine + Save */}
                        <div className="flex items-center justify-between mt-4">
                            <button
                                onClick={addMedicine}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                            >
                                + Thêm thuốc
                            </button>
                            <button
                                onClick={handleSavePrescription}
                                disabled={!formPatientId || formMeds.every(m => !m.name.trim())}
                                className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-colors ${formPatientId && formMeds.some(m => m.name.trim())
                                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg"
                                    : "bg-gray-300 cursor-not-allowed"
                                    }`}
                            >
                                ✅ Lưu đơn thuốc
                            </button>
                        </div>
                    </div>
                )}

                {/* Prescriptions List */}
                <div className="space-y-4">
                    {filteredPrescriptions.map((prescription, pIndex) => (
                        <div
                            key={prescription.id}
                            className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fade-in"
                            style={{ animationDelay: `${pIndex * 0.1}s` }}
                        >
                            {/* Prescription Header */}
                            <div
                                className={`p-4 cursor-pointer ${prescription.isActive ? "bg-emerald-50" : "bg-gray-50"}`}
                                onClick={() => setExpandedId(expandedId === prescription.id ? null : prescription.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${prescription.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {isStaff ? `BN: ${prescription.patient}` : `BS: ${prescription.doctor || "Bác sĩ"}`}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(prescription.prescribedDate)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${prescription.isActive
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-gray-100 text-gray-500"
                                            }`}>
                                            {prescription.isActive ? "Còn hiệu lực" : "Hết hiệu lực"}
                                        </span>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === prescription.id ? "rotate-180" : ""}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    {prescription.medicines.length} loại thuốc
                                </p>
                            </div>

                            {/* Medicine Cards */}
                            {expandedId === prescription.id && (
                                <div className="p-4 space-y-4 border-t animate-fade-in">
                                    {prescription.medicines.map((medicine, mIdx) => {
                                        const stockStatus = getStockStatus(medicine.remaining || 0, medicine.quantity || 1);
                                        const dosageDisplay = getDosageDisplay(medicine.dosage);
                                        const isEditing = editingMedId !== null && editingMedId === medicine.id && editMedForm !== null;

                                        return (
                                            <div
                                                key={medicine.id || mIdx}
                                                className={`border rounded-2xl p-4 transition-colors ${isEditing ? 'border-blue-400 bg-blue-50/30' : 'hover:border-blue-200'}`}
                                            >
                                                {/* Medicine Header */}
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                                                            {getMedicineIcon(medicine.type)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-gray-800">{medicine.name}</h4>
                                                            <p className="text-sm text-gray-500">{medicine.instructions}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {isDoctor && !isEditing && (
                                                        <button 
                                                            onClick={() => startEditMed(medicine)}
                                                            className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                                                        >
                                                            ✏️ Sửa
                                                        </button>
                                                    )}
                                                </div>

                                                {isEditing ? (
                                                    <div className="border-t border-blue-100 pt-3 mt-2">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                            <div>
                                                                <label className="text-xs text-gray-500 font-medium">Số lượng tổng</label>
                                                                <input
                                                                    type="number" min="1"
                                                                    value={editMedForm.quantity || 0}
                                                                    onChange={e => updateEditField("quantity", parseInt(e.target.value) || 0)}
                                                                    className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-500 font-medium">Thời gian (VD: 5 ngày)</label>
                                                                <input
                                                                    type="text"
                                                                    value={editMedForm.duration || ""}
                                                                    onChange={e => updateEditField("duration", e.target.value)}
                                                                    className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mb-4">
                                                            <label className="text-xs text-gray-500 font-medium mb-1 block">Liều dùng (viên/lần)</label>
                                                            <div className="flex gap-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm">🌅</span>
                                                                    <input type="number" min="0" value={editMedForm.dosage?.morning || 0} onChange={e => updateEditDosage("morning", e.target.value)} className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:border-blue-500 focus:outline-none" />
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm">☀️</span>
                                                                    <input type="number" min="0" value={editMedForm.dosage?.noon || 0} onChange={e => updateEditDosage("noon", e.target.value)} className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:border-blue-500 focus:outline-none" />
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm">🌙</span>
                                                                    <input type="number" min="0" value={editMedForm.dosage?.evening || 0} onChange={e => updateEditDosage("evening", e.target.value)} className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:border-blue-500 focus:outline-none" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end gap-2 text-sm">
                                                            <button onClick={cancelEditMed} className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg font-medium">Hủy</button>
                                                            <button onClick={() => handleSaveEditMed(prescription.id)} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Lưu thay đổi</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Dosage Display */}
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {dosageDisplay.map((d, i) => (
                                                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
                                                                    <span>{d.icon}</span>
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        {d.time}: {d.count} viên
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Stock Status */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 mr-4">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className={`text-xs font-medium ${stockStatus.textColor}`}>
                                                                        {stockStatus.text}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {medicine.remaining}/{medicine.quantity} viên
                                                                    </span>
                                                                </div>
                                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${stockStatus.progress > 25 ? "bg-emerald-500" : stockStatus.progress > 0 ? "bg-amber-500" : "bg-gray-300"}`}
                                                                        style={{ width: `${stockStatus.progress}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <span className="text-sm text-gray-500">{medicine.duration}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredPrescriptions.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">💊</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            Chưa có đơn thuốc
                        </h3>
                        <p className="text-gray-500">
                            Đơn thuốc sẽ hiển thị sau khi bạn được kê đơn
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
