import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDoctorsApi, getDoctorReviewsApi } from "../services/user.api";

const specialties = [
    "Tất cả",
    "Tim mạch",
    "Nhi khoa",
    "Nha khoa",
    "Thần kinh",
    "Da liễu",
    "Mắt",
    "Xương khớp",
    "Tai mũi họng",
];

const filterChips = [
    { id: "all", label: "Tất cả", icon: "🏥" },
    { id: "top-rated", label: "Đánh giá cao", icon: "⭐" },
    { id: "available", label: "Còn lịch", icon: "✅" },
];

// Doctors list component
const DoctorReviewsModal = ({ doctor, onClose }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (doctor) {
            getDoctorReviewsApi(doctor._id)
                .then(data => setReviews(data.reviews || []))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [doctor]);

    if (!doctor) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Đánh giá & Nhận xét</h3>
                        <p className="text-sm text-blue-600 font-medium">BS. {doctor.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 animate-pulse font-medium">Đang tải đánh giá...</p>
                        </div>
                    ) : reviews.length > 0 ? (
                        reviews.map((rev, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:border-blue-200 transition-colors group">
                                <div className="flex items-center gap-4 mb-3">
                                    <img
                                        src={rev.patientId?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.patientId?.name || "Patient")}&background=random`}
                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                                        alt={rev.patientId?.name}
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                            {rev.patientId?.name || "Bệnh nhân ẩn danh"}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <div className="flex text-yellow-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-current" : "text-gray-300 fill-current"}`} viewBox="0 0 20 20">
                                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium">
                                                {new Date(rev.createdAt).toLocaleDateString("vi-VN", { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed italic bg-white/50 p-3 rounded-xl border border-white">
                                    "{rev.review || "Bệnh nhân không để lại nhận xét."}"
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 px-4">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                                <span className="text-4xl filter grayscale opacity-50">⭐</span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-700 mb-2">Chưa có đánh giá nào</h4>
                            <p className="text-gray-500 max-w-xs mx-auto">Bác sĩ này chưa nhận được đánh giá nào từ bệnh nhân.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function DoctorsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get("search") || "";

    const [doctorsList, setDoctorsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedSpecialty, setSelectedSpecialty] = useState("Tất cả");
    const [activeFilter, setActiveFilter] = useState("all");
    const [selectedReviewDoctor, setSelectedReviewDoctor] = useState(null);

    useEffect(() => {
        const fetchDoctors = async () => {
            setLoading(true);
            try {
                const res = await getDoctorsApi();
                // Map API doctors to include mock UI fields if missing
                setDoctorsList((res.doctors || []).map(d => ({
                    ...d,
                    id: d._id, // Use _id as id for links
                    specialty: d.specialty || "Bác sĩ đa khoa",
                    avatar: d.avatarUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face",
                    experience: "10 năm",
                    price: 300000,
                    available: true,
                })));
            } catch (err) {
                console.error("Error fetching doctors:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    // Filter doctors
    const filteredDoctors = doctorsList.filter((doctor) => {
        const matchesSearch =
            doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSpecialty =
            selectedSpecialty === "Tất cả" || doctor.specialty === selectedSpecialty;

        const matchesFilter =
            activeFilter === "all" ||
            (activeFilter === "available" && doctor.available) ||
            (activeFilter === "top-rated" && doctor.rating >= 4.0);

        return matchesSearch && matchesSpecialty && matchesFilter;
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-8">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Tìm bác sĩ
                    </h1>
                    <p className="text-gray-500">
                        Tìm và đặt lịch với bác sĩ phù hợp
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo tên bác sĩ hoặc chuyên khoa..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white shadow-lg border-0 focus:ring-4 focus:ring-blue-200 text-gray-700"
                    />
                </div>

                {/* Filter Chips - Horizontal Scroll */}
                <div className="mb-6 -mx-4 px-4">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {filterChips.map((chip) => (
                            <button
                                key={chip.id}
                                onClick={() => setActiveFilter(chip.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap transition-all duration-300 ${activeFilter === chip.id
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                    : "bg-white text-gray-600 hover:bg-gray-50 shadow"
                                    }`}
                            >
                                <span>{chip.icon}</span>
                                <span className="font-medium">{chip.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Specialty Chips */}
                <div className="mb-6 -mx-4 px-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {specialties.map((specialty) => (
                            <button
                                key={specialty}
                                onClick={() => setSelectedSpecialty(specialty)}
                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-300 ${selectedSpecialty === specialty
                                    ? "bg-indigo-100 text-indigo-700 font-semibold"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {specialty}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count */}
                <p className="text-gray-500 mb-4">
                    Tìm thấy <span className="font-semibold text-gray-700">{filteredDoctors.length}</span> bác sĩ
                </p>

                {/* Doctor Cards */}
                <div className="space-y-4">
                    {filteredDoctors.map((doctor, index) => (
                        <div
                            key={doctor.id}
                            className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="flex gap-4">
                                {/* Avatar */}
                                <img
                                    src={doctor.avatar}
                                    alt={doctor.name}
                                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                                                <span className="text-yellow-500">⭐</span>
                                                <span className="text-sm font-bold text-amber-700">{doctor.rating || "0"}</span>
                                                <span
                                                    className="text-xs text-amber-600/70 hover:text-amber-700 cursor-pointer underline underline-offset-2 ml-0.5"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedReviewDoctor(doctor);
                                                    }}
                                                >
                                                    ({doctor.reviewsCount || 0} đánh giá)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                                <span className="text-xs font-semibold text-blue-700">{doctor.specialty}</span>
                                            </div>
                                            {/* Name & Title */}
                                            <div className="mb-4">
                                                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                    BS. {doctor.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 font-medium">{doctor.specialty}</p>
                                            </div>
                                        </div>
                                        {doctor.available ? (
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                                Còn lịch
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                                                Hết lịch
                                            </span>
                                        )}
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                            </svg>
                                            <span className="font-semibold text-gray-800">{doctor.rating}</span>
                                        </div>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500 text-sm">{doctor.reviewsCount || 0} đánh giá</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500 text-sm">{doctor.experience}</span>
                                    </div>

                                    {/* Price & Button */}
                                    <div className="flex items-center justify-between mt-4">
                                        <div>
                                            <span className="text-gray-400 text-sm">Giá khám</span>
                                            <p className="text-lg font-bold text-gray-800">
                                                {formatPrice(doctor.price)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/booking/${doctor.id}`)}
                                            disabled={!doctor.available}
                                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${doctor.available
                                                ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
                                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                }`}
                                        >
                                            Đặt lịch
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredDoctors.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            Không tìm thấy bác sĩ
                        </h3>
                        <p className="text-gray-500">
                            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                        </p>
                    </div>
                )}
            </div>

            {/* Modal Nhận xét */}
            {selectedReviewDoctor && (
                <DoctorReviewsModal
                    doctor={selectedReviewDoctor}
                    onClose={() => setSelectedReviewDoctor(null)}
                />
            )}
        </div>
    );
}
