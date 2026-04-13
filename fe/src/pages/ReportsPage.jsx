import { useMemo, useState, useEffect, useCallback } from "react";
import RevenueChart from "../components/admin/RevenueChart";
import { useAuth } from "../hooks/useAuth";
import { getOverviewReportApi, getDoctorPerformanceApi, getServiceAnalyticsApi } from "../services/report.api";

const formatDate = (date) => date.toISOString().slice(0, 10);

const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

const quickRanges = [
  { id: "today", label: "Hôm nay", days: 1 },
  { id: "7d", label: "7 ngày", days: 7 },
  { id: "30d", label: "30 ngày", days: 30 },
  { id: "month", label: "Tháng này", days: null },
];

const SERVICE_COLORS = [
  { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-100" },
  { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-100" },
  { bg: "bg-violet-500", text: "text-violet-700", light: "bg-violet-100" },
  { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-100" },
  { bg: "bg-rose-500", text: "text-rose-700", light: "bg-rose-100" },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "ADMIN";

  const today = useMemo(() => new Date(), []);
  const [activePreset, setActivePreset] = useState("7d");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return formatDate(d);
  });
  const [endDate, setEndDate] = useState(() => formatDate(today));

  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  const invalidRange = startDate > endDate;

  const setQuickRange = (preset) => {
    const end = new Date();
    let start = new Date();
    if (preset.id === "month") {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else {
      start.setDate(end.getDate() - preset.days + 1);
    }
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    setActivePreset(preset.id);
  };

  const fetchAdvancedStats = useCallback(async () => {
    if (!isAdmin || invalidRange) return;

    setLoadingDoctors(true);
    setLoadingServices(true);
    try {
      const [docRes, svcRes] = await Promise.all([
        getDoctorPerformanceApi({ startDate, endDate }),
        getServiceAnalyticsApi({ startDate, endDate }),
      ]);
      setDoctors(docRes.doctors || []);
      setServices(svcRes.services || []);
    } catch (err) {
      console.error("Advanced stats error:", err);
    } finally {
      setLoadingDoctors(false);
      setLoadingServices(false);
    }
  }, [isAdmin, startDate, endDate, invalidRange]);

  useEffect(() => {
    fetchAdvancedStats();
  }, [fetchAdvancedStats]);

  const totalServiceRequests = services.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 px-4 font-poppins">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header & Filters */}
        <div className="bg-white rounded-2xl p-6 shadow border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Báo cáo thống kê</h1>
              <p className="text-sm text-slate-500 mt-1">
                Tổng quan doanh thu, lượt khám và hiệu suất bác sĩ.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-500 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setActivePreset(null); }}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  max={endDate}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-500 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setActivePreset(null); }}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={startDate}
                />
              </div>
              <button
                onClick={fetchAdvancedStats}
                disabled={invalidRange}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-bold transition shadow-sm"
              >
                🔄 Làm mới
              </button>
            </div>
          </div>

          {/* Quick range pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {quickRanges.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setQuickRange(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  activePreset === preset.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {invalidRange && (
            <p className="text-xs text-red-600 mt-3">
              Khoảng thời gian không hợp lệ. Vui lòng kiểm tra lại.
            </p>
          )}
        </div>

        {/* Revenue Chart */}
        {!invalidRange && <RevenueChart startDate={startDate} endDate={endDate} />}

        {/* Admin-only sections */}
        {isAdmin && !invalidRange && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Doctor Leaderboard */}
            <div className="bg-white rounded-2xl shadow border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">🏆 Xếp hạng Bác sĩ</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Top bác sĩ theo số ca hoàn thành</p>
                </div>
                {loadingDoctors && (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                )}
              </div>

              {!loadingDoctors && doctors.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic text-sm">
                  Không có dữ liệu bác sĩ trong khoảng thời gian này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Bác sĩ</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Số ca</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Doanh thu (ước)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loadingDoctors
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td colSpan={4} className="px-4 py-4">
                                <div className="h-4 bg-slate-100 rounded w-full" />
                              </td>
                            </tr>
                          ))
                        : doctors.map((doc, idx) => (
                            <tr key={doc._id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3 text-sm font-bold">
                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm overflow-hidden flex-shrink-0">
                                    {doc.doctorAvatar
                                      ? <img src={doc.doctorAvatar} alt="" className="w-8 h-8 object-cover rounded-full" />
                                      : (doc.doctorName?.[0] || "?")}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">{doc.doctorName || "Không rõ"}</p>
                                    <p className="text-xs text-slate-400">{doc.doctorEmail}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  {doc.completedCases} ca
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-semibold text-blue-700">
                                  {formatCurrency(doc.estimatedRevenue)}
                                </span>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Service Analytics Pie Chart (CSS-based) */}
            <div className="bg-white rounded-2xl shadow border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">🩺 Phân tích Dịch vụ</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Tỷ trọng dịch vụ được chỉ định</p>
                </div>
                {loadingServices && (
                  <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                )}
              </div>

              {!loadingServices && services.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic text-sm">
                  Không có dữ liệu dịch vụ trong khoảng thời gian này.
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  {/* Visual bar list */}
                  {loadingServices
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse h-12 bg-slate-100 rounded-xl" />
                      ))
                    : services.map((svc, idx) => {
                        const pct = totalServiceRequests > 0
                          ? Math.round((svc.total / totalServiceRequests) * 100)
                          : 0;
                        const color = SERVICE_COLORS[idx % SERVICE_COLORS.length];
                        return (
                          <div key={svc._id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${color.bg} inline-block`} />
                                <span className="font-semibold text-slate-700">{svc.label}</span>
                              </div>
                              <div className="flex items-center gap-3 text-right">
                                <span className="text-xs text-slate-500">{svc.completed}/{svc.total} hoàn thành</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color.light} ${color.text}`}>
                                  {pct}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-700 ${color.bg}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}

                  {/* Summary totals */}
                  {!loadingServices && services.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-slate-800">{totalServiceRequests}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Tổng chỉ định</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-700">
                          {services.reduce((a, s) => a + s.completed, 0)}
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">Đã hoàn thành</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
