import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Mock doctor data (same as DoctorsPage)
const mockDoctors = [
    {
        id: 1,
        name: "BS. Nguyễn Văn A",
        specialty: "Tim mạch",
        avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face",
        price: 300000,
    },
    {
        id: 2,
        name: "BS. Trần Thị Bình",
        specialty: "Nhi khoa",
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face",
        price: 250000,
    },
    {
        id: 3,
        name: "BS. Lê Hoàng Cường",
        specialty: "Nha khoa",
        avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face",
        price: 200000,
    },
];

// Generate time slots
const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
        if (hour !== 12) {
            slots.push({
                time: `${hour.toString().padStart(2, "0")}:00`,
                available: Math.random() > 0.3,
            });
            if (hour < 17) {
                slots.push({
                    time: `${hour.toString().padStart(2, "0")}:30`,
                    available: Math.random() > 0.3,
                });
            }
        }
    }
    return slots;
};

// Suggestion chips for reason
const reasonSuggestions = [
    "Đau đầu",
    "Sốt",
    "Tái khám",
    "Khám tổng quát",
    "Ho, cảm",
    "Đau bụng",
    "Mất ngủ",
    "Khác",
];

export default function BookingPage() {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Find doctor
    const doctor = mockDoctors.find((d) => d.id === parseInt(doctorId)) || mockDoctors[0];

    // Generate next 7 days
    const dates = useMemo(() => {
        const result = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            result.push({
                date,
                dayName: date.toLocaleDateString("vi-VN", { weekday: "short" }),
                dayNum: date.getDate(),
                month: date.toLocaleDateString("vi-VN", { month: "short" }),
                isToday: i === 0,
            });
        }
        return result;
    }, []);

    const [selectedDate, setSelectedDate] = useState(dates[0]);
    const [timeSlots] = useState(generateTimeSlots);
    const [selectedTime, setSelectedTime] = useState(null);
    const [consultationType, setConsultationType] = useState("clinic");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    const handleSubmit = async () => {
        if (!selectedTime) return;

        setIsSubmitting(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Lưu appointment vào localStorage để chia sẻ giữa các tài khoản
        const dateStr = `${selectedDate.date.getFullYear()}-${String(selectedDate.date.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.dayNum).padStart(2, "0")}`;
        const newAppointment = {
            id: Date.now(),
            doctor: {
                name: doctor.name,
                specialty: doctor.specialty,
                avatar: doctor.avatar,
                phone: "0901234567",
            },
            patient: {
                name: user?.name || "Bệnh nhân",
                phone: "0909123456",
                avatar: user?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
                age: 30,
                gender: user?.gender === "female" ? "Nữ" : "Nam",
            },
            date: dateStr,
            time: selectedTime,
            type: consultationType,
            status: "pending",
            reason: reason || "Khám tổng quát",
            address: consultationType === "clinic" ? "123 Nguyễn Văn Linh, Q.7, TP.HCM" : null,
        };

        // Đọc appointments hiện tại từ localStorage
        const existing = JSON.parse(localStorage.getItem("cms_appointments") || "[]");
        existing.push(newAppointment);
        localStorage.setItem("cms_appointments", JSON.stringify(existing));

        setIsSubmitting(false);

        // Navigate to appointments with success message
        navigate("/appointments", { state: { bookingSuccess: true } });
    };

    const addSuggestion = (suggestion) => {
        if (!reason.includes(suggestion)) {
            setReason((prev) => (prev ? `${prev}, ${suggestion}` : suggestion));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-24">
            <div className="max-w-lg mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white rounded-xl transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Đặt lịch khám</h1>
                </div>

                {/* Doctor Info Card */}
                <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
                    <div className="flex items-center gap-4">
                        <img
                            src={doctor.avatar}
                            alt={doctor.name}
                            className="w-16 h-16 rounded-xl object-cover"
                        />
                        <div>
                            <h3 className="font-bold text-gray-800">{doctor.name}</h3>
                            <p className="text-blue-600 text-sm">{doctor.specialty}</p>
                            <p className="text-gray-500 text-sm mt-1">
                                Giá khám: <span className="font-semibold text-gray-800">{formatPrice(doctor.price)}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Date Selection - Horizontal Calendar */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        Chọn ngày khám
                    </h2>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                        {dates.map((dateItem, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedDate(dateItem)}
                                className={`flex flex-col items-center min-w-[72px] py-3 px-4 rounded-2xl transition-all duration-300 ${selectedDate === dateItem
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                    : "bg-white text-gray-700 hover:bg-blue-50 shadow"
                                    }`}
                            >
                                <span className={`text-xs font-medium ${selectedDate === dateItem ? "text-blue-100" : "text-gray-400"}`}>
                                    {dateItem.isToday ? "Hôm nay" : dateItem.dayName}
                                </span>
                                <span className="text-2xl font-bold my-1">
                                    {dateItem.dayNum}
                                </span>
                                <span className={`text-xs ${selectedDate === dateItem ? "text-blue-100" : "text-gray-400"}`}>
                                    {dateItem.month}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time Slots - Pills Grid */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        Chọn giờ khám
                    </h2>
                    <div className="grid grid-cols-4 gap-2">
                        {timeSlots.map((slot, index) => (
                            <button
                                key={index}
                                onClick={() => slot.available && setSelectedTime(slot.time)}
                                disabled={!slot.available}
                                className={`py-3 px-2 rounded-xl text-sm font-medium transition-all duration-300 ${selectedTime === slot.time
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : slot.available
                                        ? "bg-white text-gray-700 hover:border-blue-300 border-2 border-gray-100 hover:bg-blue-50"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-100"
                                    }`}
                            >
                                {slot.time}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded" />
                            <span>Còn trống</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-600 rounded" />
                            <span>Đang chọn</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-100 rounded" />
                            <span>Đã kín</span>
                        </div>
                    </div>
                </div>

                {/* Consultation Type Toggle */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        Hình thức khám
                    </h2>
                    <div className="bg-white rounded-2xl p-1.5 shadow-lg flex gap-2">
                        <button
                            onClick={() => setConsultationType("clinic")}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${consultationType === "clinic"
                                ? "bg-blue-600 text-white shadow"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Tại phòng khám
                        </button>
                        <button
                            onClick={() => setConsultationType("online")}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${consultationType === "online"
                                ? "bg-blue-600 text-white shadow"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Tư vấn Online
                        </button>
                    </div>
                </div>

                {/* Reason */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        Lý do khám
                    </h2>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Mô tả triệu chứng hoặc lý do khám..."
                        rows={3}
                        className="w-full p-4 bg-white rounded-2xl border-0 shadow-lg resize-none focus:ring-4 focus:ring-blue-200 text-gray-700"
                    />
                    {/* Suggestion Chips */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {reasonSuggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => addSuggestion(suggestion)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            >
                                + {suggestion}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Card */}
                {selectedTime && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white mb-6 shadow-xl animate-fade-in">
                        <h3 className="font-semibold mb-3">Thông tin đặt lịch</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-blue-100">Bác sĩ</span>
                                <span className="font-medium">{doctor.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-100">Ngày khám</span>
                                <span className="font-medium">
                                    {selectedDate.dayNum}/{selectedDate.date.getMonth() + 1}/{selectedDate.date.getFullYear()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-100">Giờ khám</span>
                                <span className="font-medium">{selectedTime}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-100">Hình thức</span>
                                <span className="font-medium">
                                    {consultationType === "clinic" ? "Tại phòng khám" : "Tư vấn Online"}
                                </span>
                            </div>
                            <div className="border-t border-white/20 pt-2 mt-2 flex justify-between">
                                <span className="text-blue-100">Tổng tiền</span>
                                <span className="font-bold text-lg">{formatPrice(doctor.price)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-xl">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedTime || isSubmitting}
                        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${selectedTime && !isSubmitting
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                Xác nhận đặt lịch
                                {selectedTime && <span className="ml-2">• {formatPrice(doctor.price)}</span>}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
