import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

// Mock prescriptions data - Doctor view: hiện tên bệnh nhân thay vì bác sĩ
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
                dosage: {
                    morning: 1,
                    noon: 0,
                    evening: 1,
                },
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
                dosage: {
                    morning: 0,
                    noon: 0,
                    evening: 0,
                    asNeeded: true,
                },
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
                dosage: {
                    morning: 1,
                    noon: 0,
                    evening: 0,
                },
                instructions: "Uống trước bữa sáng",
                quantity: 14,
                remaining: 4,
                duration: "14 ngày",
            },
            {
                id: 4,
                name: "Hydrocortisone cream 1%",
                type: "cream",
                color: "white",
                dosage: {
                    morning: 1,
                    noon: 0,
                    evening: 1,
                },
                instructions: "Bôi lên vùng da bị ảnh hưởng",
                quantity: 1,
                remaining: 1,
                duration: "7 ngày",
            },
        ],
    },
    {
        id: 3,
        prescribedDate: "2025-12-15",
        patient: "Nguyễn Thị F",
        isActive: false,
        medicines: [
            {
                id: 5,
                name: "Amlodipine 5mg",
                type: "tablet",
                color: "white",
                dosage: {
                    morning: 1,
                    noon: 0,
                    evening: 0,
                },
                instructions: "Uống mỗi sáng",
                quantity: 30,
                remaining: 0,
                duration: "30 ngày",
            },
            {
                id: 6,
                name: "Aspirin 81mg",
                type: "tablet",
                color: "white",
                dosage: {
                    morning: 0,
                    noon: 0,
                    evening: 1,
                },
                instructions: "Uống sau bữa tối",
                quantity: 30,
                remaining: 0,
                duration: "30 ngày",
            },
        ],
    },
];

// Medicine type icons
const getMedicineIcon = (type) => {
    switch (type) {
        case "capsule":
            return "💊";
        case "tablet":
            return "⚪";
        case "cream":
            return "🧴";
        case "syrup":
            return "🍯";
        case "injection":
            return "💉";
        default:
            return "💊";
    }
};

export default function PrescriptionsPage() {
    const { user } = useAuth();
    const [expandedId, setExpandedId] = useState(null);

    // Bệnh nhân mới: trống. Staff: hiện đơn thuốc của bệnh nhân
    const isStaff = user?.role === "doctor" || user?.role === "nurse" || user?.role === "admin";
    const prescriptions = isStaff ? mockDoctorPrescriptions : [];

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getDosageDisplay = (dosage) => {
        const parts = [];
        if (dosage.morning > 0) parts.push({ time: "Sáng", count: dosage.morning, icon: "🌅" });
        if (dosage.noon > 0) parts.push({ time: "Trưa", count: dosage.noon, icon: "☀️" });
        if (dosage.evening > 0) parts.push({ time: "Tối", count: dosage.evening, icon: "🌙" });
        if (dosage.asNeeded) parts.push({ time: "Khi cần", count: 1, icon: "⏰" });
        return parts;
    };

    const getStockStatus = (remaining, total) => {
        if (remaining === 0) {
            return { text: "Hết thuốc", bg: "bg-gray-100", textColor: "text-gray-500", progress: 0 };
        }
        const percentage = (remaining / total) * 100;
        if (percentage <= 25) {
            return { text: "Sắp hết", bg: "bg-amber-100", textColor: "text-amber-700", progress: percentage };
        }
        return { text: "Còn thuốc", bg: "bg-emerald-100", textColor: "text-emerald-700", progress: percentage };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {isStaff ? "Kê đơn thuốc cho bệnh nhân" : "Đơn thuốc của tôi"}
                    </h1>
                    <p className="text-gray-500">
                        {isStaff ? "Quản lý đơn thuốc đã kê cho bệnh nhân" : "Theo dõi và quản lý đơn thuốc"}
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Đang dùng</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {prescriptions.filter((p) => p.isActive).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📋</span>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Tổng đơn thuốc</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {prescriptions.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prescriptions List */}
                <div className="space-y-4">
                    {prescriptions.map((prescription, pIndex) => (
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
                                                {isStaff ? `BN: ${prescription.patient}` : prescription.doctor}
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
                                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === prescription.id ? "rotate-180" : ""
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
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
                                    {prescription.medicines.map((medicine) => {
                                        const stockStatus = getStockStatus(medicine.remaining, medicine.quantity);
                                        const dosageDisplay = getDosageDisplay(medicine.dosage);

                                        return (
                                            <div
                                                key={medicine.id}
                                                className="border rounded-2xl p-4 hover:border-blue-200 transition-colors"
                                            >
                                                {/* Medicine Header */}
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                                                        {getMedicineIcon(medicine.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-800">
                                                            {medicine.name}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            {medicine.instructions}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Dosage Display */}
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {dosageDisplay.map((d, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl"
                                                        >
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
                                                                className={`h-full rounded-full transition-all ${stockStatus.progress > 25 ? "bg-emerald-500" : stockStatus.progress > 0 ? "bg-amber-500" : "bg-gray-300"
                                                                    }`}
                                                                style={{ width: `${stockStatus.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {medicine.duration}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2">
                                        <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Đặt mua lại
                                        </button>
                                        <button className="px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Reminder Card */}
                <div className="mt-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-xl">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1">Nhắc nhở uống thuốc</h3>
                            <p className="text-white/90 text-sm">
                                Bật thông báo để nhận nhắc nhở uống thuốc đúng giờ
                            </p>
                            <button className="mt-3 px-4 py-2 bg-white text-orange-600 rounded-xl font-semibold text-sm hover:bg-orange-50 transition-colors">
                                Bật nhắc nhở
                            </button>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {prescriptions.length === 0 && (
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
