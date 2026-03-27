import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAppointmentsApi } from "../services/appointment.api";
import { confirmManualPaymentApi } from "../services/payment.api";

export default function CheckoutPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    
    // Payment specific details after confirmation
    const [invoiceData, setInvoiceData] = useState(null);

    useEffect(() => {
        const fetchAppointmentData = async () => {
            try {
                const res = await getAppointmentsApi();
                const matched = res.appointments?.find(a => a._id === id);
                if (matched) {
                    setAppointment(matched);
                    // If already paid and has orderCode, populate invoice automatically
                    if (matched.paymentStatus === "paid" && matched.orderCode) {
                        setInvoiceData({
                            orderCode: matched.orderCode,
                            amount: 300000
                        });
                    }
                } else {
                    setError("Không tìm thấy đơn đặt lịch (hoặc bạn không có quyền xem).");
                }
            } catch (err) {
                console.error("fetch error:", err);
                setError("Có lỗi hệ thống khi tải lịch hẹn.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchAppointmentData();
    }, [id]);

    const handleConfirmPayment = async () => {
        setProcessing(true);
        setError("");
        try {
            const res = await confirmManualPaymentApi(id);
            setAppointment((prev) => ({ ...prev, paymentStatus: "paid", status: "confirmed" }));
            setInvoiceData({
                orderCode: res.orderCode || appointment.orderCode || "N/A",
                amount: res.amount || 300000
            });
        } catch (err) {
            console.error("payment error:", err);
            setError("Có lỗi xảy ra khi xác nhận thanh toán.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
         return (
             <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                 <h2 className="text-xl font-bold text-red-600 mb-2">Lỗi</h2>
                 <p className="text-gray-600 mb-6 text-center">{error}</p>
                 <button onClick={() => navigate("/appointments")} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
                     Quay lại lịch hẹn
                 </button>
             </div>
         );
    }

    const priceAmount = invoiceData?.amount || 300000;
    const formatPrice = new Intl.NumberFormat("vi-VN").format(priceAmount) + "đ";

    // Hóa Đơn Điện Tử View (Success State)
    if (appointment?.paymentStatus === "paid" && invoiceData) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full border-t-8 border-green-500 relative">
                    {/* Invoice Header */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">HÓA ĐƠN ĐIỆN TỬ</h2>
                        <div className="text-green-600 font-semibold mt-1 bg-green-50 inline-block px-3 py-1 rounded-full text-sm">
                            Trạng thái: Đã thanh toán
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-lg p-5 bg-gray-50/50 mb-6">
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center justify-between pb-3 border-b border-dashed border-gray-200">
                                <span className="text-gray-500 font-medium">Mã đơn hàng:</span>
                                <span className="font-mono font-bold text-gray-800 bg-white px-2 py-1 rounded shadow-sm border border-gray-100 items-center flex gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>
                                    {invoiceData.orderCode}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 font-medium">Bác sĩ:</span>
                                <span className="font-semibold text-gray-800">{appointment.doctorId?.name || "Đang xếp lịch"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 font-medium">Chuyên khoa:</span>
                                <span className="font-semibold text-gray-800">{appointment.doctorId?.specialty || "Đa khoa"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 font-medium">Ngày giờ khám:</span>
                                <span className="font-semibold text-blue-600">
                                    {appointment.time} ({appointment.date?.split("-").reverse().join("/")})
                                </span>
                            </div>
                            
                            <div className="pt-4 mt-2 flex items-center justify-between border-t border-gray-200">
                                <span className="text-gray-800 font-bold uppercase tracking-wide">Tổng chi phí</span>
                                <span className="font-black text-xl text-blue-600">{formatPrice}</span>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => navigate("/appointments")} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition duration-300 shadow-md">
                        Tiếp tục / Trở về
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">
                        Cảm ơn bạn đã sử dụng dịch vụ của phòng khám.
                    </p>
                </div>
            </div>
        );
    }

    // Pending Checkout Summary View
    return (
        <div className="min-h-screen bg-slate-50 pt-20 pb-24">
            <div className="max-w-md mx-auto px-4">
                 
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate("/appointments")}
                        className="p-2 hover:bg-white rounded-xl transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">
                        Thanh toán đặt lịch
                    </h1>
                </div>

                {/* Pre-payment Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                            Tóm tắt dịch vụ
                        </h2>

                        <div className="space-y-4 text-sm mb-6">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 font-medium">Bác sĩ phụ trách:</span>
                                <span className="font-semibold text-gray-800 text-right">{appointment.doctorId?.name || "Đang xếp lịch"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 font-medium">Chuyên khoa:</span>
                                <span className="font-semibold text-gray-800 text-right">{appointment.doctorId?.specialty || "Đa khoa"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 font-medium">Ngày khám:</span>
                                <span className="font-semibold text-gray-800">{appointment.date?.split("-").reverse().join("/")}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 font-medium">Giờ khám:</span>
                                <span className="font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">{appointment.time}</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mt-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-600 font-semibold uppercase text-xs tracking-wider">Chi phí thanh toán</span>
                            </div>
                            <div className="text-3xl font-black text-gray-800">{formatPrice}</div>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-6 px-4">
                    <p className="text-sm text-gray-500">
                        Vui lòng kiểm tra lại thông tin đơn đặt lịch. Sau khi nhấn xác nhận, bạn sẽ nhận được hóa đơn điện tử cho lịch hẹn này.
                    </p>
                </div>

                {/* Confirm Action */}
                <button
                    onClick={handleConfirmPayment}
                    disabled={processing}
                    className={`w-full py-4 mt-2 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                        processing
                        ? "bg-blue-400 text-white cursor-wait"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 hover:-translate-y-1"
                    }`}
                >
                    {processing ? (
                         <>
                             <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                             </svg>
                             Đang xử lý...
                         </>
                    ) : (
                         <>
                            Xác nhận đặt lịch & Thanh toán
                         </>
                    )}
                </button>
                <button
                    onClick={() => navigate("/appointments")}
                    className="w-full mt-4 py-3 rounded-xl font-semibold text-gray-500 bg-transparent hover:bg-gray-100 transition-colors"
                >
                    Trở về
                </button>

            </div>
        </div>
    );
}
