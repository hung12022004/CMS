import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="text-center px-6">
                <div className="text-8xl mb-4">🚫</div>
                <h1 className="text-4xl font-bold text-white mb-3">
                    Không có quyền truy cập
                </h1>
                <p className="text-slate-400 text-lg mb-8">
                    Bạn không có quyền truy cập trang này. Vui lòng liên hệ admin nếu cần
                    hỗ trợ.
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors mr-3"
                >
                    ← Quay lại
                </button>
                <button
                    onClick={() => navigate("/")}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                    Trang chủ
                </button>
            </div>
        </div>
    );
}
