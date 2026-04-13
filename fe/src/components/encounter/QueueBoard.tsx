import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  getServiceQueueApi,
  updateEncounterServiceStatusApi,
} from "../../services/encounter.api";
import { socket, connectSocket, disconnectSocket, joinDeptRoom } from "../../services/socketClient";
import ServiceResultForm from "./ServiceResultForm";

interface ServiceData {
  _id: string;
  serviceType: string;
  status: string;
  assignedRoom?: any;
  assignedDoctor?: any;
  encounterId?: string;
  patientId?: string;
}

interface QueueItem {
  encounterId: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  service: ServiceData;
  date?: string;
}

interface User {
  _id: string;
  role: string;
  specialization?: string;
}

type GroupedQueue = Record<string, QueueItem[]>;

const STATUS_COLUMNS = [
  { key: "PENDING", label: "Chờ" },
  { key: "IN_PROGRESS", label: "Đang thực hiện" },
  { key: "COMPLETED", label: "Hoàn thành" },
];

const SERVICE_LABELS: Record<string, string> = {
  VITALS: "Sinh hiệu",
  BLOOD_TEST: "Lấy máu",
  DENTAL: "RHM",
  X_RAY: "X-Quang",
  ULTRASOUND: "Siêu âm",
};

interface QueueBoardProps {
  department?: string;
}

const QueueBoard: React.FC<QueueBoardProps> = ({ department }) => {
  const auth = useAuth() as any;
  const user = auth.user as User | null;
  const [services, setServices] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Khởi khởi tạo filter từ department props hoặc specialization của user
  const initialFilter = useMemo(() => {
    if (department) return department;
    if (user?.specialization && user.specialization !== "NONE") return user.specialization;
    return "VITALS";
  }, [department, user?.specialization]);

  const [serviceTypeFilter, setServiceTypeFilter] = useState(initialFilter);

  // Sync filter nếu prop thay đổi
  useEffect(() => {
    if (department) {
      setServiceTypeFilter(department);
    } else if (user?.specialization && user.specialization !== "NONE") {
       setServiceTypeFilter(user.specialization);
    }
  }, [department, user?.specialization]);

  // State cho Modal nhập kết quả
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!serviceTypeFilter) return;
    try {
      setError("");
      const res = await getServiceQueueApi({ serviceType: serviceTypeFilter, status: undefined });
      setServices(res.queue || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể tải hàng đợi.");
    } finally {
      setLoading(false);
    }
  }, [serviceTypeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchQueue();

    connectSocket();
    socket.on("connect", () => joinDeptRoom(serviceTypeFilter));

    socket.on("new_service_request", (newReq: ServiceData) => {
      // Chỉ nhận nếu khớp với filter hiện tại
      if (newReq.serviceType !== serviceTypeFilter) return;

      setServices((prev) => {
        if (prev.find((item) => item.service?._id === newReq._id)) return prev;
        return [...prev, {
          encounterId: newReq.encounterId || "",
          patientId: newReq.patientId || "",
          patientName: "Bệnh nhân mới", 
          service: newReq
        }];
      });
    });

    socket.on("service_updated_in_kanban", (updated: ServiceData) => {
      // Chỉ nhận nếu khớp với filter hiện tại
      if (updated.serviceType !== serviceTypeFilter) return;

      setServices((prev) => {
        return prev.map((item) => 
          item.service?._id === updated._id ? { ...item, service: updated } : item
        );
      });
    });

    return () => {
      socket.off("connect");
      socket.off("new_service_request");
      socket.off("service_updated_in_kanban");
    };
  }, [fetchQueue, serviceTypeFilter]);

  const grouped: GroupedQueue = useMemo(() => {
    const map: GroupedQueue = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    };
    services.forEach((item) => {
      const status = item.service?.status;
      if (status && map[status]) {
        map[status].push(item);
      }
    });
    return map;
  }, [services]);

  const handleOpenResultForm = async (item: QueueItem, autoAdvanceToInProgress = false) => {
    setSelectedItem(item);
    setShowResultModal(true);
    
    if (autoAdvanceToInProgress && item.service.status === "PENDING") {
      try {
        await updateEncounterServiceStatusApi({
          encounterId: item.encounterId,
          serviceId: item.service._id,
          status: "IN_PROGRESS",
        });
        await fetchQueue();
      } catch (err: any) {
        console.error("Auto advance to IN_PROGRESS failed", err);
      }
    }
  };

  const handleSaveResult = async (status: string, resultData: string, resultImageUrl: string, attachmentFile?: File | null) => {
    if (!selectedItem) return;
    try {
      await updateEncounterServiceStatusApi({
        encounterId: selectedItem.encounterId,
        serviceId: selectedItem.service._id,
        status: status,
        resultData: resultData,
        resultImageUrl: resultImageUrl,
        attachmentFile: attachmentFile,
      });
      if (status === "COMPLETED") {
        setShowResultModal(false);
        setSelectedItem(null);
      }
      await fetchQueue();
    } catch (err: any) {
      throw err; // Ném lỗi để component form xử lý
    }
  };

  if (!serviceTypeFilter) {
    return (
      <div className="bg-white rounded-xl p-6 shadow border border-gray-100 text-sm text-gray-500">
        Không tìm thấy phòng ban của bác sĩ.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Hàng đợi dịch vụ</h3>
          <p className="text-xs text-gray-500 mt-1">Theo phòng ban / dịch vụ đã chỉ định.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Chỉ hiện chọn dịch vụ nếu là Admin/Nurse, bác sĩ chuyên khoa thì fix cứng */}
          {(!user?.specialization || user.specialization === "NONE") && (
            <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
            >
                {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
                ))}
            </select>
          )}
          <button
            className="text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-1"
            onClick={fetchQueue}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className="bg-gray-50 rounded-xl border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h4 className="font-semibold text-gray-700">{col.label}</h4>
                <span className="text-xs font-bold text-gray-500">
                  {grouped[col.key]?.length || 0}
                </span>
              </div>
              <div className="p-3 space-y-3">
                {(grouped[col.key] || []).length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-6">Không có</div>
                ) : (
                  (grouped[col.key] || []).map((item, index) => (
                    <div
                      key={item.service._id}
                      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {SERVICE_LABELS[item.service.serviceType] || item.service.serviceType}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            BN: {item.patientName || "N/A"}
                          </p>
                          {item.patientPhone && (
                            <p className="text-xs text-gray-400">{item.patientPhone}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">#{index + 1}</span>
                      </div>

                      {col.key === "PENDING" && (
                        <button
                          className="mt-3 w-full bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-blue-700"
                          onClick={() => handleOpenResultForm(item, true)}
                        >
                          Tiếp nhận
                        </button>
                      )}

                      {col.key === "IN_PROGRESS" && (
                        <button
                          className="mt-3 w-full bg-amber-500 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-amber-600"
                          onClick={() => handleOpenResultForm(item)}
                        >
                          Nhập kết quả
                        </button>
                      )}

                      {col.key === "COMPLETED" && (
                        <button
                          className="mt-3 w-full bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-emerald-200"
                          onClick={() => handleOpenResultForm(item)}
                        >
                          Xem kết quả
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal nhập kết quả đã được chuyển sang ServiceResultForm */}
      {showResultModal && selectedItem && (
          <ServiceResultForm 
              item={selectedItem} 
              onClose={() => {
                  setShowResultModal(false);
                  setSelectedItem(null);
              }} 
              onSave={handleSaveResult} 
          />
      )}
    </div>
  );
};

export default QueueBoard;
