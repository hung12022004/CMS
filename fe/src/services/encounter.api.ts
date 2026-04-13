import api from "./api";

export const getMyLatestEncounterApi = async () => {
  const res = await api.get("/encounters/my-latest");
  return res.data;
};

export const getEncounterByIdApi = async (encounterId: string) => {
  const res = await api.get(`/encounters/${encounterId}`);
  return res.data;
};

export const getActiveEncounterApi = async (patientId: string) => {
  const res = await api.get(`/encounters/active/${patientId}`);
  return res.data;
};

export const getPatientHistoryApi = async () => {
  const res = await api.get(`/encounters/patient/history`);
  return res.data;
};

export const getServiceQueueApi = async ({ serviceType, status }: { serviceType: string; status?: string }) => {
  const res = await api.get("/encounters/services/queue", {
    params: { serviceType, status },
  });
  return res.data;
};

export const startEncounterApi = async ({ patientId }: { patientId: string }) => {
  const res = await api.post("/encounters/start", { patientId });
  return res.data;
};

export const createEncounterServiceApi = async ({
  encounterId,
  serviceType,
  assignedRoom,
  assignedDoctor,
}: {
  encounterId: string;
  serviceType: string;
  assignedRoom?: string;
  assignedDoctor?: string;
}) => {
  const res = await api.post(`/encounters/${encounterId}/services`, {
    serviceType,
    assignedRoom,
    assignedDoctor,
  });
  return res.data;
};

export const updateEncounterServiceStatusApi = async ({
  encounterId,
  serviceId,
  status,
  resultData,
  resultImageUrl,
  attachmentFile,
}: {
  encounterId: string;
  serviceId: string;
  status: string;
  resultData?: string;
  resultImageUrl?: string;
  attachmentFile?: File | null;
}) => {
  const formData = new FormData();
  formData.append("status", status);
  if (resultData !== undefined) formData.append("resultData", resultData);
  if (resultImageUrl !== undefined) formData.append("resultImageUrl", resultImageUrl);
  if (attachmentFile) formData.append("attachment", attachmentFile);

  const res = await api.patch(
    `/encounters/${encounterId}/services/${serviceId}/status`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
};
