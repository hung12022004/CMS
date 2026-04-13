import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DashboardSkeleton from "./DashboardSkeleton";
import { getOverviewReportApi } from "../../services/report.api";

// Cau truc Data vi du tra ve tu aggregation API
interface DailyRevenue {
  date: string;
  patients: number;
  revenue: number;
}

interface ReportOverview {
  totalRevenue: number;
  totalPatients: number;
  dailyRevenue: DailyRevenue[];
}

interface RevenueChartProps {
  startDate: string;
  endDate: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ startDate, endDate }) => {
  const [data, setData] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!startDate || !endDate) return;
    let active = true;
    setLoading(true);
    setError("");

    getOverviewReportApi({ startDate, endDate })
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((err) => {
        if (!active) return;
        const message =
          err?.response?.data?.message ||
          "Không thể tải báo cáo, vui lòng thử lại.";
        setError(message);
        setData(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  const dailyRevenue = useMemo(() => {
    if (!data || !Array.isArray(data.dailyRevenue)) return [];
    return data.dailyRevenue;
  }, [data]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-xl shadow border border-red-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Báo cáo</h3>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full bg-white rounded-xl shadow border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Báo cáo</h3>
        <p className="text-sm text-gray-500">
          Không có dữ liệu trong khoảng thời gian đã chọn.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center">
          <div className="flex bg-blue-100 text-blue-600 p-4 rounded-full items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
          <div className="ml-5">
            <h4 className="text-gray-500 text-sm font-medium mb-1">Tổng lượt khám</h4>
            <span className="text-3xl font-bold text-gray-800">{data.totalPatients}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center">
          <div className="flex bg-green-100 text-green-600 p-4 rounded-full items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="ml-5">
            <h4 className="text-gray-500 text-sm font-medium mb-1">Tổng doanh thu (VNĐ)</h4>
            <span className="text-3xl font-bold text-gray-800">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(data.totalRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="w-full bg-white rounded-xl shadow border border-gray-100 p-6 pt-5">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Biểu đồ doanh thu và lượt khám</h3>
        {dailyRevenue.length === 0 ? (
          <div className="w-full h-[240px] flex items-center justify-center text-sm text-gray-500">
            Không có dữ liệu để hiển thị biểu đồ.
          </div>
        ) : (
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: "12px", fontFamily: "Poppins, sans-serif" }} />
                <YAxis yAxisId="left" stroke="#6B7280" style={{ fontSize: "12px", fontFamily: "Poppins, sans-serif" }} />
                <YAxis yAxisId="right" orientation="right" stroke="#6B7280" style={{ fontSize: "12px", fontFamily: "Poppins, sans-serif" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
                  labelStyle={{ fontWeight: "bold", color: "#374151" }}
                  formatter={(value: number | string, name: string) => {
                    if (name === "Doanh Thu (VNĐ)") {
                      const numberValue = typeof value === "number" ? value : Number(value);
                      return [
                        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(numberValue || 0),
                        name,
                      ];
                    }
                    return [value, name];
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh Thu (VNĐ)"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="patients"
                  name="Lượt Khám"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
