import api from "./api";

export const getOverviewReportApi = async ({ startDate, endDate }) => {
  const res = await api.get("/reports/overview", {
    params: { startDate, endDate },
    headers: { "Cache-Control": "no-cache" },
  });
  return res.data;
};

export const getDoctorPerformanceApi = async ({ startDate, endDate } = {}) => {
  const res = await api.get("/reports/doctor-performance", {
    params: { startDate, endDate },
    headers: { "Cache-Control": "no-cache" },
  });
  return res.data;
};

export const getServiceAnalyticsApi = async ({ startDate, endDate } = {}) => {
  const res = await api.get("/reports/service-analytics", {
    params: { startDate, endDate },
    headers: { "Cache-Control": "no-cache" },
  });
  return res.data;
};