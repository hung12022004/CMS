import api from "./api";

/**
 * GET /api/v1/schedules?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&doctorId=...
 */
export const getSchedulesApi = async (params = {}) => {
    const res = await api.get("/schedules", { params });
    return res.data;
};

/**
 * PUT /api/v1/schedules — upsert (create or update) per doctor+date
 * body: { doctorId, date, isWorking, startTime?, endTime?, notes? }
 */
export const upsertScheduleApi = async (payload) => {
    const res = await api.put("/schedules", payload);
    return res.data;
};

/**
 * DELETE /api/v1/schedules/:id
 */
export const deleteScheduleApi = async (id) => {
    const res = await api.delete(`/schedules/${id}`);
    return res.data;
};
