import React, { useState, useRef, useCallback } from "react";
import { previewExcelApi, bulkImportApi } from "../../services/schedule.api";

interface ScheduleRecord {
  doctorId: string;
  doctorName?: string;
  doctorEmail?: string;
  date: string;
  shiftCode?: string | null;
  startTime: string;
  endTime: string;
  notes: string;
  rowNumber?: number;
  raw?: Record<string, string>;
  errorReason?: string;
}

interface ImportScheduleProps {
  onImported?: () => void;
  onClose?: () => void;
}

const SHIFT_LABELS: Record<string, string> = {
  CA_SANG:  "Ca sáng (07:00 – 12:00)",
  CA_CHIEU: "Ca chiều (13:00 – 17:00)",
  CA_TOAN:  "Ca toàn ngày (07:00 – 17:00)",
  CA_TOI:   "Ca tối (18:00 – 22:00)",
  CA_DEM:   "Ca đêm (22:00 – 06:00)",
};

// ─── Template generator ─────────────────────────────────────────────────────
const downloadTemplate = () => {
  const XLSX = (window as any).XLSX;
  if (!XLSX) {
    // Fallback: generate CSV
    const csv = [
      "bacSi,ngay,ca,batDau,ketThuc,ghiChu",
      "Nguyen Van A,2026-04-10,CA_SANG,,, Ví dụ dùng mã ca",
      "doctor@example.com,2026-04-11,,08:00,12:00,Ví dụ dùng giờ tùy chỉnh",
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lich_bac_si_mau.csv";
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const data = [
    {
      bacSi: "Nguyễn Văn A  (hoặc email bác sĩ)",
      ngay: "2026-04-10",
      ca: "CA_SANG",
      batDau: "",
      ketThuc: "",
      ghiChu: "Dùng mã ca tiện hơn"
    },
    {
      bacSi: "doctor@example.com",
      ngay: "2026-04-11",
      ca: "",
      batDau: "08:00",
      ketThuc: "14:00",
      ghiChu: "Dùng giờ tùy chỉnh"
    },
    {
      bacSi: "Trần Thị B",
      ngay: "2026-04-12",
      ca: "CA_CHIEU",
      batDau: "",
      ketThuc: "",
      ghiChu: ""
    },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LichBacSi");
  XLSX.writeFile(wb, "lich_bac_si_mau.xlsx");
};

// ─── Main Component ─────────────────────────────────────────────────────────
const ImportSchedule: React.FC<ImportScheduleProps> = ({ onImported, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validRecords, setValidRecords] = useState<ScheduleRecord[]>([]);
  const [errorRecords, setErrorRecords] = useState<ScheduleRecord[]>([]);
  const [toast, setToast] = useState({ msg: "", type: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 4000);
  };

  // ─── Drag-and-drop handlers ────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith(".xlsx") || dropped.name.endsWith(".xls") || dropped.name.endsWith(".csv"))) {
      setFile(dropped);
    } else {
      showToast("Chỉ hỗ trợ file .xlsx, .xls, .csv", "error");
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  // ─── Preview ─────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!file) { showToast("Vui lòng chọn hoặc kéo thả file Excel", "error"); return; }
    setLoading(true);
    try {
      const data = await previewExcelApi(file);
      setValidRecords(data.validRecords || []);
      setErrorRecords(data.errorRecords || []);
      setStep(2);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Lỗi đọc file Excel", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Confirm import ───────────────────────────────────────────────────────
  const handleImport = async () => {
    if (validRecords.length === 0) { showToast("Không có dữ liệu hợp lệ để Import", "error"); return; }
    setLoading(true);
    try {
      const res = await bulkImportApi(validRecords);
      showToast(`✅ Import thành công ${res.count} lịch làm việc!`, "success");
      setTimeout(() => {
        reset();
        onImported?.();
      }, 2000);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Lỗi lưu Database", "error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setValidRecords([]);
    setErrorRecords([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-5 text-white flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-xl flex items-center gap-2">
              📥 Import lịch từ Excel
            </h2>
            <p className="text-teal-100 text-sm mt-0.5">
              {step === 1 ? "Tải lên file Excel chứa lịch làm việc" : `Xem trước: ${validRecords.length} hợp lệ · ${errorRecords.length} lỗi`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">✕</button>
        </div>

        {/* Toast */}
        {toast.msg && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium flex-shrink-0 ${
            toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Shift code guide */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="font-semibold text-blue-800 text-sm mb-2">📋 Mã ca làm việc được hỗ trợ:</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-blue-700">
                  {Object.entries(SHIFT_LABELS).map(([code, label]) => (
                    <div key={code} className="flex items-center gap-1.5">
                      <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold">{code}</code>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-2 italic">
                  Cột <strong>bacSi</strong>: nhập tên bác sĩ hoặc email. Cột <strong>ngay</strong>: định dạng YYYY-MM-DD hoặc DD/MM/YYYY.
                </p>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-teal-400 bg-teal-50 scale-[1.01] shadow-lg"
                    : "border-gray-300 hover:border-teal-400 hover:bg-teal-50"
                }`}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center text-3xl">
                  {isDragging ? "📂" : "📊"}
                </div>
                <p className="font-semibold text-gray-700 text-base">
                  {isDragging ? "Thả file vào đây..." : "Kéo thả file hoặc bấm để chọn"}
                </p>
                <p className="text-sm text-gray-400 mt-1">Hỗ trợ .xlsx, .xls, .csv</p>
                {file && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-sm font-medium px-4 py-2 rounded-full">
                    ✅ {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} className="hidden" />
              </div>

              {/* Template download */}
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium hover:underline transition"
                >
                  📥 Tải file mẫu (.csv)
                </button>
                <span className="text-gray-400 text-xs">Điền theo cấu trúc mẫu để tránh lỗi</span>
              </div>
            </div>
          )}

          {/* STEP 2: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-600 uppercase">✅ Hợp lệ</p>
                  <p className="text-3xl font-black text-emerald-700 mt-1">{validRecords.length}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Sẽ được lưu (upsert)</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-600 uppercase">❌ Lỗi</p>
                  <p className="text-3xl font-black text-red-600 mt-1">{errorRecords.length}</p>
                  <p className="text-xs text-red-500 mt-0.5">Sẽ bị bỏ qua</p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Hàng</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Bác sĩ</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ngày</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Thời gian</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ghi chú / Lý do lỗi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {/* Error rows */}
                    {errorRecords.map((item, idx) => (
                      <tr key={`err-${idx}`} className="bg-red-50">
                        <td className="px-4 py-3 text-red-600 font-bold text-xs">#{item.rowNumber}</td>
                        <td className="px-4 py-3">
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">Lỗi</span>
                        </td>
                        <td className="px-4 py-3 text-red-800 text-xs">{(item.raw as any)?.bacSi || (item.raw as any)?.doctorEmail || "—"}</td>
                        <td className="px-4 py-3 text-red-800 text-xs">{(item.raw as any)?.ngay || (item.raw as any)?.date || "—"}</td>
                        <td className="px-4 py-3 text-center text-red-500 text-xs">—</td>
                        <td className="px-4 py-3 text-red-600 text-xs font-medium">{item.errorReason}</td>
                      </tr>
                    ))}
                    {/* Valid rows */}
                    {validRecords.map((item, idx) => (
                      <tr key={`val-${idx}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 text-xs">#{item.rowNumber}</td>
                        <td className="px-4 py-3">
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">OK</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800 text-sm">{item.doctorName}</p>
                          <p className="text-gray-400 text-xs">{item.doctorEmail}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-700">{item.date}</td>
                        <td className="px-4 py-3 text-center">
                          {item.shiftCode ? (
                            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{item.shiftCode}</span>
                          ) : (
                            <span className="font-mono text-xs text-gray-600">{item.startTime} → {item.endTime}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{item.notes || "—"}</td>
                      </tr>
                    ))}
                    {validRecords.length === 0 && errorRecords.length === 0 && (
                      <tr><td colSpan={6} className="py-10 text-center text-gray-400 italic">File không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center gap-3 flex-shrink-0 bg-gray-50">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="px-5 py-2 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition text-sm">
                Hủy
              </button>
              <button
                onClick={handlePreview}
                disabled={!file || loading}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition flex items-center gap-2 text-sm shadow-sm"
              >
                {loading ? <span className="animate-spin">⏳</span> : "🔍"} Xem trước dữ liệu
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { reset(); }} className="px-5 py-2 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition text-sm">
                ← Chọn file khác
              </button>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition text-sm">
                  Hủy
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading || validRecords.length === 0}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition flex items-center gap-2 text-sm shadow-sm"
                >
                  {loading ? <span className="animate-spin">⏳</span> : "✅"} Xác nhận lưu ({validRecords.length} lịch)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportSchedule;
