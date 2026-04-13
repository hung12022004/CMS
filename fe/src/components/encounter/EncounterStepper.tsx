import React from "react";

type ServiceStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";

interface ServiceProps {
  _id: string;
  serviceType: string;
  status: ServiceStatus;
  assignedRoom?: any;
  resultData?: string;
  resultImageUrl?: string;
}

interface EncounterStepperProps {
  services: ServiceProps[];
}

const SERVICE_LABELS: Record<string, string> = {
  VITALS: "Sinh hiệu",
  BLOOD_TEST: "Lấy máu",
  DENTAL: "RHM",
  X_RAY: "X-Quang",
  ULTRASOUND: "Siêu âm",
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  PENDING: "Chờ",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELED: "Đã hủy",
};

const EncounterStepper: React.FC<EncounterStepperProps> = ({ services }) => {
  if (!services || services.length === 0) {
    return (
      <div className="w-full p-4 text-center text-gray-500 italic bg-white rounded-lg shadow">
        Chưa có dịch vụ nào được chỉ định cho đợt khám này.
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
        Tiến trình khám bệnh
      </h3>
      <div className="relative">
        <ul className="relative flex flex-col md:flex-row gap-2">
          {services.map((service, index) => {
            const isCompleted = service.status === "COMPLETED";
            const isInProgress = service.status === "IN_PROGRESS";
            const isCanceled = service.status === "CANCELED";

            let iconBgColor = "bg-gray-200 text-gray-500";
            if (isCompleted) iconBgColor = "bg-green-500 text-white";
            else if (isInProgress) iconBgColor = "bg-blue-500 text-white";
            else if (isCanceled) iconBgColor = "bg-red-500 text-white";

            return (
              <li
                key={service._id}
                className="relative flex-1 md:flex md:items-center p-4 pl-0 md:p-0 group"
              >
                <div className="flex items-start gap-3 md:flex-col md:text-center md:gap-2">
                  <div className="flex md:w-full items-center">
                    <span
                      className={`flex items-center justify-center w-8 h-8 md:mx-auto rounded-full text-sm font-semibold shrink-0 ring-4 ring-white ${iconBgColor} transition-colors duration-200 shadow-sm`}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </span>
                    {index !== services.length - 1 && (
                      <div
                        className={`hidden md:block w-full h-1 ml-2 mr-2 rounded ${
                          isCompleted ? "bg-green-500" : "bg-gray-200"
                        }`}
                      ></div>
                    )}
                  </div>

                  <div className="md:mt-2 w-full">
                    <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {SERVICE_LABELS[service.serviceType] || service.serviceType}
                    </p>
                    <div className="text-xs text-gray-500">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isCompleted
                            ? "bg-green-100 text-green-700"
                            : isInProgress
                            ? "bg-blue-100 text-blue-700"
                            : isCanceled
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[service.status]}
                      </span>
                    </div>

                    {/* Hướng dẫn nơi chờ */}
                    {service.status === "PENDING" && (
                       <div className="mt-2 text-xs font-medium text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                          Bạn đang chờ tại quầy: <span className="font-bold">{SERVICE_LABELS[service.serviceType] || service.serviceType}</span>
                       </div>
                    )}

                    {service.assignedRoom && (
                      <div className="text-[11px] text-gray-400 mt-1">
                        Phòng: {service.assignedRoom?.name || service.assignedRoom}
                      </div>
                    )}

                    {/* Hiển thị kết quả nếu có */}
                    {isCompleted && (service.resultData || service.resultImageUrl) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-left">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Kết quả chuyên môn</p>
                            {service.resultData && <p className="text-sm text-gray-700 whitespace-pre-wrap">{service.resultData}</p>}
                            {service.resultImageUrl && (
                                <a 
                                  href={service.resultImageUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="mt-2 inline-block text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  Xem ảnh kết quả
                                </a>
                            )}
                        </div>
                    )}
                  </div>
                </div>
                {index !== services.length - 1 && (
                  <div
                    className={`md:hidden absolute left-[15px] top-[40px] bottom-[-16px] w-[2px] ${
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default EncounterStepper;
