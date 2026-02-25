import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * ProtectedRoute - Bảo vệ route theo role
 * @param {string[]} allowedRoles - Mảng roles được phép truy cập
 */
export default function ProtectedRoute({ allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Chưa đăng nhập → login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Nếu có danh sách role cho phép, kiểm tra
    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(user.role)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <Outlet />;
}
