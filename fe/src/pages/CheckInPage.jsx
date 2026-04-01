import { useState } from "react";
import { createQueueEntryApi } from "../services/checkin.api";
import { useAuth } from "../hooks/useAuth";

const SPECIALTIES = [
    "Đa khoa",
    "Tim mạch",
    "Nội khoa",
    "Ngoại khoa",
    "Nhi khoa",
    "Sản phụ khoa",
    "Mắt",
    "Tai mũi họng",
    "Da liễu",
    "Cơ xương khớp",
    "Thần kinh",
    "Nha khoa",
    "Tâm thần",
    "Tiêu hóa",
    "Hô hấp",
    "Nội tiết",
];

export default function CheckInPage() {
    const { user } = useAuth();
    const isLoggedIn = !!user;

    const [form, setForm] = useState({
        patientName: user?.name || "",
        patientPhone: user?.phoneNumber || "",
        symptoms: "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.patientName.trim() || !form.symptoms.trim()) {
            setError("Vui lòng nhập đầy đủ họ tên và triệu chứng.");
            return;
        }
        setLoading(true);
        try {
            const data = await createQueueEntryApi(form);
            setSuccess(data);
        } catch (err) {
            setError(err.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSuccess(null);
        setForm({ 
            patientName: user?.name || "", 
            patientPhone: user?.phoneNumber || "", 
            symptoms: "" 
        });
        setError("");
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-fade-in">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <span className="text-5xl">✓</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h2>
                    <p className="text-gray-500 mb-6">Vui lòng giữ số thứ tự của bạn và chờ y tá gọi tên.</p>

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 mb-6 shadow-inner">
                        <p className="text-blue-100 text-sm mb-1">Số thứ tự của bạn</p>
                        <p className="text-7xl font-black text-white tracking-tight">
                            {String(success.entry?.queueNumber).padStart(2, "0")}
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2">
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Họ tên</span>
                            <span className="text-sm font-semibold text-gray-700">{success.entry?.patientName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Thời gian</span>
                            <span className="text-sm font-semibold text-gray-700">
                                {new Date(success.entry?.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-6">
                        Y tá sẽ phân loại và chỉ định bác sĩ phù hợp dựa trên triệu chứng của bạn.
                    </p>

                    <button
                        onClick={handleReset}
                        className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        Đăng ký cho bệnh nhân khác
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">
                            🏥
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Đăng ký khám bệnh</h1>
                            <p className="text-blue-100 text-sm">Phòng khám Đa khoa CMS</p>
                        </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                        {["1. Khai báo", "2. Y tá phân loại", "3. Khám bệnh"].map((step, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-medium ${i === 0
                                    ? "bg-white text-indigo-700"
                                    : "bg-white/20 text-white"
                                    }`}
                            >
                                <span className="w-4 h-4 rounded-full bg-current opacity-20 inline-block"></span>
                                {step}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div className="p-8">
                    <p className="text-gray-500 text-sm mb-6">
                        Vui lòng điền đầy đủ thông tin bên dưới. Y tá sẽ hỗ trợ phân loại và chỉ định bác sĩ phù hợp.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Họ và tên <span className="text-red-500">*</span>
                                {isLoggedIn && <span className="ml-2 text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Từ tài khoản</span>}
                            </label>
                            <input
                                name="patientName"
                                value={form.patientName}
                                onChange={handleChange}
                                readOnly={isLoggedIn}
                                placeholder="Nguyễn Văn A"
                                className={`w-full px-4 py-3 border rounded-xl text-gray-700 placeholder-gray-300 focus:outline-none transition ${
                                    isLoggedIn
                                        ? "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                                        : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                }`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Số điện thoại
                                {isLoggedIn
                                    ? <span className="ml-2 text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Từ tài khoản</span>
                                    : <span className="ml-1 text-xs font-normal text-gray-400">(không bắt buộc)</span>
                                }
                            </label>
                            <input
                                name="patientPhone"
                                value={form.patientPhone}
                                onChange={handleChange}
                                readOnly={isLoggedIn}
                                placeholder="0912 345 678"
                                type="tel"
                                className={`w-full px-4 py-3 border rounded-xl text-gray-700 placeholder-gray-300 focus:outline-none transition ${
                                    isLoggedIn
                                        ? "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                                        : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                }`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Triệu chứng / Lý do khám <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="symptoms"
                                value={form.symptoms}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Mô tả triệu chứng của bạn (vd: Đau đầu, sốt cao 38°C từ hôm qua...)"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Mô tả càng chi tiết, bác sĩ phù hợp sẽ được chỉ định nhanh hơn.
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold text-base rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <span>📋</span>
                                    Gửi đăng ký khám
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Thông tin của bạn được bảo mật hoàn toàn theo quy định của phòng khám.
                    </p>
                </div>
            </div>
        </div>
    );
}
