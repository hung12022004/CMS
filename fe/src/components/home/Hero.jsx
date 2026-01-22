export default function Hero() {
  return (
    <section
      className="relative h-[70vh] w-full bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      {/* overlay cho chữ/nút nổi hơn */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex items-center justify-end">
        <div className="text-right">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Clinic Management System
          </h1>
          <p className="mt-4 text-gray-200 max-w-md ml-auto">
            Quản lý phòng khám thông minh, tối ưu quy trình và trải nghiệm bệnh nhân.
          </p>

          <button
            className="mt-6 inline-flex items-center justify-center rounded-xl
                       bg-blue-600 px-6 py-3 text-white font-semibold
                       hover:bg-blue-700 transition"
          >
            Contact Us
          </button>
        </div>
      </div>
    </section>
  );
}
