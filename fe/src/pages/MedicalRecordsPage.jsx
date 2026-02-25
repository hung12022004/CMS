import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Mock medical records - Doctor view: hiện bệnh nhân thay vì bác sĩ
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
    const [expandedId, setExpandedId] = useState(null);
    const [activeAccordion, setActiveAccordion] = useState({});

    // Bệnh nhân mới: trống. Staff/Doctor: hiện hồ sơ bệnh nhân để kê
    const isStaff = user?.role === "doctor" || user?.role === "nurse" || user?.role === "admin";
    const records = isStaff ? mockDoctorRecords : [];

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {isStaff ? "Hồ sơ bệnh án bệnh nhân" : "Hồ sơ bệnh án"}
                    </h1>
                    <p className="text-gray-500">
                        {isStaff ? "Quản lý và kê hồ sơ cho bệnh nhân" : "Lịch sử khám và kết quả điều trị"}
                    </p>
                </div>

                {/* Timeline */}
                <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200" />

                    {/* Records */}
                    <div className="space-y-6">
                        {records.map((record, index) => (
                            <div
                                key={record.id}
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
                                        onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-blue-600 font-semibold">
                                                {formatDate(record.date)}
                                            </span>
                                            <svg
                                                className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === record.id ? "rotate-180" : ""
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <img
                                                src={isStaff ? record.patient.avatar : record.doctor?.avatar}
                                                alt={isStaff ? record.patient.name : record.doctor?.name}
                                                className="w-12 h-12 rounded-xl object-cover"
                                            />
                                            <div>
                                                <h3 className="font-bold text-gray-800">
                                                    {isStaff ? record.patient.name : record.doctor?.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {isStaff
                                                        ? `${record.patient.gender}, ${record.patient.age} tuổi`
                                                        : record.doctor?.specialty
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                                            <p className="text-sm text-gray-500">Chẩn đoán</p>
                                            <p className="font-semibold text-gray-800">
                                                {record.diagnosis}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedId === record.id && (
                                        <div className="border-t px-5 py-4 space-y-4 animate-fade-in">
                                            {/* Symptoms Accordion */}
                                            <div className="border rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => toggleAccordion(record.id, "symptoms")}
                                                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                                                >
                                                    <span className="font-medium text-gray-700">
                                                        📋 Triệu chứng ({record.symptoms.length})
                                                    </span>
                                                    <svg
                                                        className={`w-4 h-4 text-gray-400 transition-transform ${isAccordionOpen(record.id, "symptoms") ? "rotate-180" : ""
                                                            }`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                {isAccordionOpen(record.id, "symptoms") && (
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

                                            {/* Prescriptions Accordion */}
                                            <div className="border rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => toggleAccordion(record.id, "prescriptions")}
                                                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                                                >
                                                    <span className="font-medium text-gray-700">
                                                        💊 Đơn thuốc ({record.prescriptions.length})
                                                    </span>
                                                    <svg
                                                        className={`w-4 h-4 text-gray-400 transition-transform ${isAccordionOpen(record.id, "prescriptions") ? "rotate-180" : ""
                                                            }`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                {isAccordionOpen(record.id, "prescriptions") && (
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

                                            {/* Tests Accordion */}
                                            {record.tests.length > 0 && (
                                                <div className="border rounded-xl overflow-hidden">
                                                    <button
                                                        onClick={() => toggleAccordion(record.id, "tests")}
                                                        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <span className="font-medium text-gray-700">
                                                            🔬 Kết quả xét nghiệm ({record.tests.length})
                                                        </span>
                                                        <svg
                                                            className={`w-4 h-4 text-gray-400 transition-transform ${isAccordionOpen(record.id, "tests") ? "rotate-180" : ""
                                                                }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                    {isAccordionOpen(record.id, "tests") && (
                                                        <div className="p-4 space-y-3">
                                                            {record.tests.map((test, i) => (
                                                                <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                                                    <div>
                                                                        <p className="font-semibold text-gray-800">{test.name}</p>
                                                                        <p className="text-sm text-gray-600">{test.result}</p>
                                                                    </div>
                                                                    <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                        </svg>
                                                                    </button>
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
                                                <button className="px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                </button>
                                                <button className="px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                    </svg>
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
