import { useAuth } from "../hooks/useAuth";
import QueueBoard from "../components/encounter/QueueBoard";

export default function EncounterBoardPage() {
  const { user } = useAuth();
  const departmentMap = {
    LABORATORY: "BLOOD_TEST",
    X_RAY: "X_RAY",
    INTERNAL_MEDICINE: "VITALS",
  };
  
  // Ưu tiên specialization nếu có, nếu không thì dùng department map
  const department = user?.specialization && user.specialization !== "NONE" 
    ? user.specialization 
    : (departmentMap[user?.department] || user?.department || "");

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 px-4 font-poppins">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">Hàng đợi dịch vụ</h1>
          <p className="text-sm text-slate-500 mt-1">
            Danh sách dịch vụ đang chờ theo phòng ban.
          </p>
        </div>

        <QueueBoard department={department} />
      </div>
    </div>
  );
}
