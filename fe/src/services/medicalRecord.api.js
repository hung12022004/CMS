import api from "./api";

export const getMedicalRecordsApi = async () => {
    const { data } = await api.get("/medical-records");
    return data;
};

export const createMedicalRecordApi = async (recordData) => {
    const { data } = await api.post("/medical-records", recordData);
    return data;
};
