import React, { useState } from "react";
import { toggleBanUserApi } from "../../services/user.api";

// Cấu trúc Type minh họa cho User
interface User {
  _id: string;
  name: string;
  email: string;
  accountStatus?: "ACTIVE" | "BANNED";
}

interface BanUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BanUserModal: React.FC<BanUserModalProps> = ({ user, isOpen, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !user) return null;

  const isBanned = user.accountStatus === "BANNED";
  const actionType = isBanned ? "UNBAN" : "BAN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage("Vui lòng nhập lý do khóa tài khoản!");
      return;
    }

    setErrorMessage(""); // Xóa lỗi nếu đã nhập
    setLoading(true);

    try {
      await toggleBanUserApi(user._id, {
        action: actionType,
        reason: reason.trim(),
      });
      onSuccess();
      onClose();
      setReason(""); // Reset form
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.response?.data?.message || "Đã xảy ra lỗi khi thực thi lệnh.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isBanned ? "bg-green-50" : "bg-red-50"}`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-lg font-bold flex items-center gap-2 ${isBanned ? "text-green-700" : "text-red-700"}`}>
              {isBanned ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mở Khóa Tài Khoản
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 outline-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Khóa Tài Khoản
                </>
              )}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 mb-1">
              Bạn đang chuẩn bị {isBanned ? "mở khóa" : "khóa"} tài khoản:
            </p>
            <div className="flex items-center gap-2">
               <p className="font-semibold text-gray-800 text-lg">{user.name}</p>
               {isBanned && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    BANNED
                  </span>
               )}
            </div>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Lý do thực hiện <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                required
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                placeholder={isBanned ? "Lý do mở khóa người dùng này..." : "Lý do vi phạm để khóa tài khoản..."}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {errorMessage && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center justify-center min-w-[120px] ${
                  isBanned 
                    ? "bg-green-600 hover:bg-green-700 disabled:bg-green-300"
                    : "bg-red-600 hover:bg-red-700 disabled:bg-red-300"
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  isBanned ? "Xác nhận Mở" : "Xác nhận Khóa"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BanUserModal;
