import { useEffect, useState, useMemo } from "react";
import { getPatientHistoryApi } from "../services/encounter.api";
import { useAuth } from "../hooks/useAuth";
import { socket, connectSocket, disconnectSocket, joinPatientRoom } from "../services/socketClient";

// Định nghĩa label của dịch vụ
const SERVICE_LABELS = {
  VITALS: "Đo sinh hiệu",
  BLOOD_TEST: "Xét nghiệm máu",
  DENTAL: "Răng Hàm Mặt",
  X_RAY: "Chụp X-Quang",
  ULTRASOUND: "Siêu âm",
};

export default function EncounterFlowPage() {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getPatientHistoryApi();
      setEncounters(res.encounters || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải lịch sử khám.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    connectSocket();
    socket.on("connect", () => joinPatientRoom(user._id));

    const handleServiceAssigned = (newService) => {
      setEncounters((prev) => {
        const encounterExists = prev.some((enc) => enc._id === newService.encounterId);
        if (!encounterExists) {
            // Nếu chưa có phiên khám này trong state, fetch lại toàn bộ lịch sử cho an toàn
            fetchHistory();
            return prev;
        }

        return prev.map((enc) => {
          if (enc._id === newService.encounterId) {
             // Kiểm tra trùng lặp
             if (enc.services.find(s => s._id === newService._id)) return enc;
             return { ...enc, services: [...enc.services, newService] };
          }
          return enc;
        });
      });
    };

    const handleStatusChanged = (updatedService) => {
      setEncounters((prev) =>
        prev.map((enc) => {
          if (enc._id === updatedService.encounterId) {
            return {
              ...enc,
              services: enc.services.map((s) =>
                s._id === updatedService._id ? updatedService : s
              ),
            };
          }
          return enc;
        })
      );
    };

    socket.on("service_assigned", handleServiceAssigned);
    socket.on("service_status_changed", handleStatusChanged);

    return () => {
      socket.off("connect");
      socket.off("service_assigned", handleServiceAssigned);
      socket.off("service_status_changed", handleStatusChanged);
      disconnectSocket();
    };
  }, [user?._id]);

  // Tính trạng thái tổng quát trong ngày
  const activeServicesCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let count = 0;
    encounters.forEach(enc => {
        if (enc.date === todayStr && !enc.isLocked) {
            enc.services.forEach(s => {
                if (s.status === "PENDING" || s.status === "IN_PROGRESS") {
                    count++;
                }
            });
        }
    });
    return count;
  }, [encounters]);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 px-4 font-poppins">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header & Tổng quát */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tiến trình khám</h1>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi lịch sử và các dịch vụ khám bệnh của bạn.
            </p>
          </div>
          {activeServicesCount > 0 ? (
              <div className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl border border-blue-100 font-semibold text-sm flex items-center gap-2 animate-pulse">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  Bạn còn {activeServicesCount} dịch vụ chưa thực hiện!
              </div>
          ) : (
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl border border-emerald-100 font-semibold text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Không có dịch vụ nào đang chờ.
              </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : encounters.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl shadow-sm border border-slate-100">
             <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             </div>
             <p className="text-gray-500 font-medium">Chưa có lịch sử khám bệnh nào.</p>
          </div>
        ) : (
          <div className="space-y-6">
             {encounters.map((encounter) => (
                 <EncounterCard key={encounter._id} encounter={encounter} />
             ))}
          </div>
        )}
      </div>
    </div>
  );
}

const EncounterCard = ({ encounter }) => {
    // Format ngày HH:mm DD/MM/YYYY
    const formattedDate = new Date(encounter.createdAt).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Card Header */}
            <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${encounter.status === 'COMPLETED' ? 'bg-slate-50' : 'bg-blue-50/50'}`}>
                <div>
                   <p className="text-xs text-slate-500 font-medium mb-0.5">Ngày khám</p>
                   <p className="text-sm font-bold text-slate-800">{formattedDate}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-500 font-medium mb-0.5">Bác sĩ chỉ định</p>
                   <p className="text-sm font-bold text-slate-800">{encounter.clinicalDoctorId?.name || "Chưa cập nhật"}</p>
                </div>
            </div>

            {/* Vertical Stepper Timeline */}
            <div className="p-5">
                {encounter.services.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-2">Chưa có dịch vụ nào được chỉ định.</p>
                ) : (
                    <div className="relative border-l-2 border-slate-100 ml-4 space-y-6">
                        {encounter.services.map((svc, i) => (
                            <TimelineNode key={svc._id} service={svc} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const TimelineNode = ({ service }) => {
    const isPending = service.status === "PENDING";
    const isInProgress = service.status === "IN_PROGRESS";
    const isCompleted = service.status === "COMPLETED";

    const label = SERVICE_LABELS[service.serviceType] || service.serviceType;
    const roomName = service.assignedRoom?.name || service.assignedRoom || "Chờ xếp phòng";

    return (
        <div className="relative pl-6 transition-all duration-300">
            {/* Status Dot/Icon */}
            <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center transition-colors duration-500 ${
                isCompleted ? "bg-emerald-500 text-white" : 
                isInProgress ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]" : 
                "bg-slate-200 text-slate-500"
            }`}>
               {isCompleted && (
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
               )}
               {isInProgress && (
                   <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
               )}
               {isPending && (
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               )}
            </div>

            {/* Content Body */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                    <h4 className={`text-base font-bold ${
                        isCompleted ? "text-emerald-700" :
                        isInProgress ? "text-blue-700" :
                        "text-slate-700"
                    }`}>
                        {label}
                    </h4>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold w-fit ${
                        isCompleted ? "bg-emerald-100 text-emerald-700" :
                        isInProgress ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                    }`}>
                        {isCompleted ? "Đã xong" : isInProgress ? "Đang xử lý..." : "Đang chờ"}
                    </span>
                </div>

                {isPending && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs py-2 px-3 rounded-lg w-full mt-2 font-medium shadow-sm">
                        📍 Vị trí: <span className="font-bold">{roomName}</span> - Vui lòng đợi đến lượt.
                    </div>
                )}

                {isInProgress && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs py-2 px-3 rounded-lg w-full mt-2 font-medium shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Bác sĩ đang cập nhật kết quả tại phòng {roomName}...
                    </div>
                )}

                {isCompleted && (service.resultData || service.resultImageUrl || service.attachmentUrl) && (
                    <div className="bg-slate-50 border border-slate-200 text-sm py-2 px-3 rounded-lg w-full mt-2 transition-all">
                        <p className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                             Kết luận chuyên môn:
                        </p>
                        {service.resultData && (
                            <p className="text-slate-700 text-xs font-medium whitespace-pre-wrap leading-relaxed border-l-2 border-emerald-400 pl-2 ml-1">
                                {service.resultData}
                            </p>
                        )}
                        {/* File attachment (uploaded PDF/image) */}
                        {service.attachmentUrl && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {service.attachmentName?.endsWith(".pdf") ? (
                                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className="text-xs text-gray-600 truncate max-w-[160px]">{service.attachmentName || "Tệp đính kèm"}</span>
                                <a
                                    href={`http://localhost:5000${service.attachmentUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    Xem kết quả
                                </a>
                                <a
                                    href={`http://localhost:5000${service.attachmentUrl}`}
                                    download={service.attachmentName || undefined}
                                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Tải về
                                </a>
                            </div>
                        )}
                        {/* Legacy: raw image url */}
                        {service.resultImageUrl && !service.attachmentUrl && (
                            <a href={service.resultImageUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-bold hover:underline mt-2 flex items-center gap-1 w-fit">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Xem ảnh đính kèm
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};