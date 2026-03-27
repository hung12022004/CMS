import api from "./api";

export const getMedicalRecordsApi = async () => {
    const { data } = await api.get("/medical-records");
    return data;
};

export const createMedicalRecordApi = async (recordData) => {
    const { data } = await api.post("/medical-records", recordData);
    return data;
};

export const updateMedicalRecordApi = async (id, recordData) => {
    const { data } = await api.put(`/medical-records/${id}`, recordData);
    return data;
};
