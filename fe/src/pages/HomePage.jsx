import { useEffect } from "react";
import { meApi } from "../services/auth.api";
import Hero from "../components/home/Hero";

export default function HomePage() {
  const hasToken = !!localStorage.getItem("accessToken");

  // loading / ok / unauth

  useEffect(() => {
    if (!hasToken) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await meApi();
        if (cancelled) return;
        setMe(data.user);
        setStatus("ok");
      } catch {
        if (cancelled) return;
        setStatus("unauth");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  return (
    <div className="min-h-[calc(100vh-140px)] items-center justify-center py-10 bg-gray-50 flex flex-col gap-10">
      <Hero />


      <div className="w-full max-w-6xl px-4 mb-28">
  <h2 className="text-3xl font-bold text-gray-900 text-center">
    Our Clinic
  </h2>
  <p className="mt-3 text-gray-600 text-center max-w-2xl mx-auto">
    Phòng khám của chúng tôi cung cấp dịch vụ chăm sóc sức khỏe hiện đại,
    chuyên nghiệp và tận tâm, đặt trải nghiệm bệnh nhân lên hàng đầu.
  </p>

  <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Card 1 */}
    <div className="group rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm transition hover:shadow-lg">
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
          Trang thiết bị tiên tiến, đạt chuẩn quốc tế, đảm bảo chẩn đoán
          chính xác và an toàn.
        </p>
      </div>
    </div>

    {/* Card 2 */}
    <div className="group rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm transition hover:shadow-lg">
      <div className="h-48 overflow-hidden">
        <img
          src="https://jieh.vn/upload/images/c%C3%A1c%20b%C3%A1c%20s%C4%A9.png"
          alt="Đội ngũ bác sĩ"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900">
          Đội ngũ bác sĩ
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Các bác sĩ giàu kinh nghiệm, tận tâm và luôn lắng nghe bệnh nhân.
        </p>
      </div>
    </div>

    {/* Card 3 */}
    <div className="group rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm transition hover:shadow-lg">
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
          Theo dõi – tư vấn – điều trị trọn vẹn trong suốt quá trình.
        </p>
      </div>
    </div>
  </div>
</div>

    </div>
  );
}
