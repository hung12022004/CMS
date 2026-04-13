import React, { useState, useEffect } from "react";
import { getUserBanHistoryApi } from "../../services/admin.api";

interface ActionLog {
  _id: string;
  actionType: "BAN" | "UNBAN";
  reason: string;
  createdAt: string;
  actionBy: {
    name: string;
    email: string;
  } | null;
}

interface BanHistoryModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

const BanHistoryModal: React.FC<BanHistoryModalProps> = ({ user, isOpen, onClose }) => {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && user?._id) {
      fetchHistory();
    }
  }, [isOpen, user]);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUserBanHistoryApi(user._id);
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Lỗi khi lấy lịch sử thao tác.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Lịch sử Ban/Unban: {user.name || user.email}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p>Chưa có lịch sử thao tác nào cho tài khoản này.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log._id} className={"border rounded-xl p-4 " + (log.actionType === "BAN" ? "bg-red-50/30 border-red-100" : "bg-green-50/30 border-green-100")}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.actionType === "BAN" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {log.actionType}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm border">
                      Bởi: <span className="font-medium text-gray-700">{log.actionBy?.name || log.actionBy?.email || "Unknown"}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Lý do:</p>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-100">
                      {log.reason || <span className="italic text-gray-400">Không có lý do</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default BanHistoryModal;
