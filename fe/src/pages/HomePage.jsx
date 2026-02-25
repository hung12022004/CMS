import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Trang Welcome - Landing page cho người chưa đăng nhập
// Redirect đến Dashboard nếu đã đăng nhập
export default function HomePage() {
  const { user, loading } = useAuth();

  // Đang kiểm tra auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Đã đăng nhập -> Redirect đến Dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Chưa đăng nhập -> Hiển thị Landing Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Chăm sóc sức khỏe
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {" "}thông minh
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Đặt lịch khám bác sĩ, quản lý hồ sơ bệnh án và theo dõi đơn thuốc
            - tất cả trong một ứng dụng.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Đăng ký ngay
            </a>
            <a
              href="/login"
              className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              Đăng nhập
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Tại sao chọn chúng tôi?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-2xl hover:bg-blue-50 transition-colors">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Đặt lịch dễ dàng
              </h3>
              <p className="text-gray-600">
                Chọn bác sĩ, thời gian phù hợp và đặt lịch chỉ trong vài phút.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-2xl hover:bg-emerald-50 transition-colors">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Hồ sơ điện tử
              </h3>
              <p className="text-gray-600">
                Lưu trữ và truy cập hồ sơ bệnh án mọi lúc, mọi nơi.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-2xl hover:bg-orange-50 transition-colors">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Quản lý đơn thuốc
              </h3>
              <p className="text-gray-600">
                Theo dõi đơn thuốc, nhắc nhở uống thuốc đúng giờ.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clinic Info Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Phòng khám của chúng tôi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <div className="h-48 overflow-hidden">
                <img
                  src="https://shingmarkhospital.com.vn/public/userfiles/ho-so-cong-bo-trang-thiet-bi-y-te_(1).jpg"
                  alt="Cơ sở vật chất"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cơ sở vật chất hiện đại
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Trang thiết bị tiên tiến, đạt chuẩn quốc tế.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <div className="h-48 overflow-hidden">
                <img
                  src="https://jieh.vn/upload/images/c%C3%A1c%20b%C3%A1c%20s%C4%A9.png"
                  alt="Đội ngũ bác sĩ"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">
                  Đội ngũ bác sĩ giỏi
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Các bác sĩ giàu kinh nghiệm, tận tâm với bệnh nhân.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <div className="h-48 overflow-hidden">
                <img
                  src="https://www.baovietnhantho.com.vn/storage/911e182d-374f-4d32-ae85-bde5f7a994f1/bao-hiem-cham-soc-y-te.jpg"
                  alt="Chăm sóc toàn diện"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">
                  Chăm sóc toàn diện
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Theo dõi, tư vấn và điều trị trọn vẹn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Sẵn sàng chăm sóc sức khỏe?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Đăng ký ngay để trải nghiệm dịch vụ y tế thông minh.
          </p>
          <a
            href="/register"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all shadow-lg"
          >
            Bắt đầu ngay
          </a>
        </div>
      </div>
    </div>
  );
}
