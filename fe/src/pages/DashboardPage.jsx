import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Mock data for banners
const banners = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=400&fit=crop",
        title: "Gói khám sức khỏe tổng quát",
        subtitle: "Giảm 20% cho lần khám đầu tiên",
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=400&fit=crop",
        title: "Tư vấn sức khỏe Online",
        subtitle: "Gặp bác sĩ ngay tại nhà",
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800&h=400&fit=crop",
        title: "Chăm sóc sức khỏe gia đình",
        subtitle: "Gói ưu đãi dành cho gia đình bạn",
    },
];

// Quick menu items
const quickMenuItems = [
    {
        id: 1,
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        label: "Đặt lịch khám",
        path: "/doctors",
        color: "bg-blue-500",
        lightColor: "bg-blue-50",
    },
    {
        id: 2,
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
        label: "Lịch hẹn của tôi",
        path: "/appointments",
        color: "bg-emerald-500",
        lightColor: "bg-emerald-50",
    },
    {
        id: 3,
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        label: "Hồ sơ bệnh án",
        path: "/medical-records",
        color: "bg-violet-500",
        lightColor: "bg-violet-50",
    },
    {
        id: 4,
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
        label: "Đơn thuốc",
        path: "/prescriptions",
        color: "bg-orange-500",
        lightColor: "bg-orange-50",
    },
];

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentBanner, setCurrentBanner] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [notificationCount] = useState(3);

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Chào buổi sáng";
        if (hour < 18) return "Chào buổi chiều";
        return "Chào buổi tối";
    };

    // Auto-slide banner
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Helper function to get avatar URL
    const getAvatarSrc = () => {
        if (!user?.avatarUrl) {
            return "https://i.pravatar.cc/100";
        }
        if (user.avatarUrl.startsWith("/uploads")) {
            return `http://localhost:5000${user.avatarUrl}`;
        }
        return user.avatarUrl;
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/doctors?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 pt-20 pb-32 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Top Row: Greeting + Notification */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <img
                                src={getAvatarSrc()}
                                alt="Avatar"
                                className="w-14 h-14 rounded-full border-3 border-white/30 object-cover shadow-lg"
                            />
                            <div>
                                <p className="text-blue-100 text-sm">
                                    {getGreeting()}
                                </p>
                                <h1 className="text-white text-2xl font-bold">
                                    {user?.name || "User"}
                                </h1>
                            </div>
                        </div>

                        {/* Notification Bell */}
                        <button
                            className="relative p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300"
                            onClick={() => navigate("/notifications")}
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {notificationCount > 0 && (
                                <span className="notification-badge">
                                    {notificationCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative">
                        <div className="relative">
                            <svg
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm chuyên khoa, bác sĩ, triệu chứng..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white shadow-xl border-0 focus:ring-4 focus:ring-blue-200 text-gray-700 placeholder-gray-400 text-lg"
                            />
                        </div>
                    </form>
                </div>
            </div>

            {/* Main Content - Overlap with header */}
            <div className="max-w-5xl mx-auto px-4 -mt-20">
                {/* Quick Menu Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {quickMenuItems.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group animate-fade-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className={`w-14 h-14 ${item.lightColor} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                <div className={`${item.color} text-white rounded-lg p-2`}>
                                    {item.icon}
                                </div>
                            </div>
                            <p className="text-gray-700 font-semibold text-sm text-left">
                                {item.label}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Banner Slider */}
                <div className="relative rounded-3xl overflow-hidden shadow-xl mb-8">
                    <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentBanner * 100}%)` }}
                    >
                        {banners.map((banner) => (
                            <div key={banner.id} className="min-w-full relative">
                                <img
                                    src={banner.image}
                                    alt={banner.title}
                                    className="w-full h-48 md:h-64 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="text-xl md:text-2xl font-bold mb-1">
                                        {banner.title}
                                    </h3>
                                    <p className="text-white/80 text-sm md:text-base">
                                        {banner.subtitle}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Banner Dots */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentBanner(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentBanner
                                        ? "w-6 bg-white"
                                        : "bg-white/50 hover:bg-white/70"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        Dịch vụ phổ biến
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: "🏥", label: "Khám tổng quát" },
                            { icon: "🦷", label: "Nha khoa" },
                            { icon: "👁️", label: "Mắt" },
                            { icon: "❤️", label: "Tim mạch" },
                            { icon: "🧠", label: "Thần kinh" },
                            { icon: "🩺", label: "Xem thêm..." },
                        ].map((service, index) => (
                            <button
                                key={index}
                                onClick={() => navigate("/doctors")}
                                className="flex flex-col items-center p-4 rounded-xl hover:bg-blue-50 transition-colors"
                            >
                                <span className="text-2xl mb-2">{service.icon}</span>
                                <span className="text-xs text-gray-600 text-center font-medium">
                                    {service.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Health Tips */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1">Mẹo sức khỏe hôm nay</h3>
                            <p className="text-white/90 text-sm">
                                Uống đủ 2 lít nước mỗi ngày giúp cơ thể thanh lọc độc tố và duy trì năng lượng.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
