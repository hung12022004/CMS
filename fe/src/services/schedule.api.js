import api from "./api";

export const getSchedulesApi = async (params = {}) => {
    const res = await api.get("/schedules", { params });
    return res.data;
};

export const upsertScheduleApi = async (payload) => {
    const res = await api.put("/schedules", payload);
    return res.data;
};

export const deleteScheduleApi = async (id) => {
    const res = await api.delete(`/schedules/${id}`);
    return res.data;
};

/** POST /api/v1/schedules/preview-excel — parse file, validate, return preview */
export const previewExcelApi = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    
    // Explicitly Get token to ensure it is sent with multipart requests
    const token = localStorage.getItem("accessToken");
    
    const res = await api.post("/schedules/preview-excel", formData, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    return res.data;
};

/** POST /api/v1/schedules/bulk-import — upsert with socket emit */
export const bulkImportApi = async (validRecords) => {
    const token = localStorage.getItem("accessToken");
    const res = await api.post("/schedules/bulk-import", { validRecords }, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    return res.data;
};

/** POST /api/v1/schedules/import-excel (legacy compat) */
export const importExcelApi = async (payload) => {
    const res = await api.post("/schedules/import-excel", payload);
    return res.data;
};

