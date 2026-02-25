import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Mock appointments data (Doctor/Nurse view - hiển thị bệnh nhân) - fallback demo
const mockDoctorAppointments = {
    upcoming: [
        {
            id: 102,
            patient: {
                name: "Trần Thị D",
                phone: "0909234567",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
                age: 41,
                gender: "Nữ",
            },
            date: "2026-02-24",
            time: "09:30",
            type: "clinic",
            status: "pending",
            reason: "Đau ngực, khó thở",
            address: "123 Nguyễn Văn Linh, Q.7, TP.HCM",
        },
    ],
    history: [
        {
            id: 104,
            patient: {
                name: "Nguyễn Thị F",
                phone: "0909456789",
                avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
                age: 31,
                gender: "Nữ",
            },
            date: "2026-02-20",
            time: "14:00",
            type: "clinic",
            status: "completed",
            reason: "Khám tổng quát",
            address: "123 Nguyễn Văn Linh, Q.7, TP.HCM",
        },
    ],
};


const statusConfig = {
    pending: {
        label: "Chờ xác nhận",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: "🕐",
    },
    confirmed: {
        label: "Đã xác nhận",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: "✅",
    },
    completed: {
        label: "Đã hoàn thành",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: "✔️",
    },
    cancelled: {
        label: "Đã hủy",
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: "❌",
    },
};

export default function AppointmentsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("upcoming");
    const [showSuccess, setShowSuccess] = useState(location.state?.bookingSuccess || false);

    const isStaffView = user?.role === "doctor" || user?.role === "nurse" || user?.role === "admin";

    // Đọc appointments từ localStorage (được lưu khi bệnh nhân đặt lịch)
    const [savedAppointments, setSavedAppointments] = useState([]);
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("cms_appointments") || "[]");
        setSavedAppointments(stored);
    }, []);

    // Xây dựng data source
    let dataSource;
    if (isStaffView) {
        // Doctor/Nurse: hiện bệnh nhân đã đặt lịch từ localStorage + mock demo
        const lsUpcoming = savedAppointments.filter(a => a.status !== "completed" && a.status !== "cancelled");
        dataSource = {
            upcoming: [...lsUpcoming, ...mockDoctorAppointments.upcoming],
            history: mockDoctorAppointments.history,
        };
    } else {
        // Patient: hiện lịch hẹn đã đặt từ localStorage
        const lsUpcoming = savedAppointments.filter(a => a.status !== "completed" && a.status !== "cancelled");
        const lsHistory = savedAppointments.filter(a => a.status === "completed");
        dataSource = {
            upcoming: lsUpcoming,
            history: lsHistory,
        };
    }

    const appointments = activeTab === "upcoming" ? dataSource.upcoming : dataSource.history;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const handleCall = (phone) => {
        window.location.href = `tel:${phone}`;
    };

    const handleDirections = (address) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-8">
            <div className="max-w-5xl mx-auto px-4">
                {/* Success Message */}
                {showSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-emerald-800">Đặt lịch thành công!</p>
                            <p className="text-sm text-emerald-600">Chúng tôi sẽ xác nhận lịch hẹn sớm nhất.</p>
                        </div>
                        <button onClick={() => setShowSuccess(false)} className="text-emerald-500 hover:text-emerald-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Header */}
                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    {isStaffView ? "Bệnh nhân hẹn khám" : "Lịch hẹn của tôi"}
                </h1>

                {/* Tabs */}
                <div className="bg-white rounded-2xl p-1.5 shadow-lg flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab("upcoming")}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${activeTab === "upcoming"
                            ? "bg-blue-600 text-white shadow"
                            : "text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        Sắp tới
                        {dataSource.upcoming.length > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === "upcoming" ? "bg-white/20" : "bg-blue-100 text-blue-600"
                                }`}>
                                {dataSource.upcoming.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${activeTab === "history"
                            ? "bg-blue-600 text-white shadow"
                            : "text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        Lịch sử
                    </button>
                </div>

                {/* Appointments List */}
                <div className="space-y-4">
                    {appointments.map((appointment, index) => {
                        const status = statusConfig[appointment.status];
                        return (
                            <div
                                key={appointment.id}
                                className={`bg-white rounded-2xl overflow-hidden shadow-lg border-l-4 ${status.border} animate-fade-in`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Status Banner */}
                                <div className={`px-5 py-2 ${status.bg} flex items-center justify-between`}>
                                    <span className={`font-medium text-sm ${status.text} flex items-center gap-2`}>
                                        <span>{status.icon}</span>
                                        {status.label}
                                    </span>
                                    <span className="text-gray-500 text-sm">
                                        {appointment.type === "clinic" ? "🏥 Tại phòng khám" : "💻 Tư vấn Online"}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex gap-4">
                                        <img
                                            src={isStaffView ? appointment.patient.avatar : appointment.doctor.avatar}
                                            alt={isStaffView ? appointment.patient.name : appointment.doctor.name}
                                            className="w-16 h-16 rounded-xl object-cover"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800">
                                                {isStaffView ? appointment.patient.name : appointment.doctor.name}
                                            </h3>
                                            <p className="text-blue-600 text-sm">
                                                {isStaffView
                                                    ? `${appointment.patient.gender}, ${appointment.patient.age} tuổi`
                                                    : appointment.doctor.specialty
                                                }
                                            </p>
                                            {isStaffView && appointment.reason && (
                                                <p className="text-gray-500 text-xs mt-1">Lý do: {appointment.reason}</p>
                                            )}

                                            {/* Date & Time */}
                                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>{formatDate(appointment.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>{appointment.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {activeTab === "upcoming" && (
                                        <div className="flex gap-3 mt-4 pt-4 border-t">
                                            {/* Call Button */}
                                            <button
                                                onClick={() => handleCall(isStaffView ? appointment.patient?.phone : appointment.doctor?.phone)}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                Gọi điện
                                            </button>

                                            {/* Directions Button */}
                                            {appointment.address && (
                                                <button
                                                    onClick={() => handleDirections(appointment.address)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Chỉ đường
                                                </button>
                                            )}

                                            <div className="flex-1" />

                                            {/* Reschedule Button */}
                                            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                                Đổi lịch
                                            </button>

                                            {/* Cancel Button */}
                                            <button className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                Hủy
                                            </button>
                                        </div>
                                    )}

                                    {/* History Actions */}
                                    {activeTab === "history" && appointment.status === "completed" && (
                                        <div className="flex gap-3 mt-4 pt-4 border-t">
                                            <button
                                                onClick={() => navigate("/medical-records")}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Xem hồ sơ
                                            </button>
                                            <button className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                                Đánh giá
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {appointments.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            {activeTab === "upcoming" ? "Không có lịch hẹn sắp tới" : "Chưa có lịch sử khám"}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {activeTab === "upcoming" ? "Đặt lịch khám ngay để chăm sóc sức khỏe" : "Các lịch hẹn đã hoàn thành sẽ hiển thị ở đây"}
                        </p>
                        {activeTab === "upcoming" && (
                            <button
                                onClick={() => navigate("/doctors")}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Đặt lịch ngay
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
