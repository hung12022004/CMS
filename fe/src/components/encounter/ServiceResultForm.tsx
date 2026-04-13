import React, { useState, useEffect, useRef } from "react";

interface ServiceResultFormProps {
    item: any;
    onClose: () => void;
    onSave: (status: string, resultData: string, resultImageUrl: string, attachmentFile?: File | null) => Promise<void>;
}

// Helper: detect file type icon
function FileTypeIcon({ name }: { name: string }) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
        return (
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
        );
    }
    return (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
    );
}

const API_BASE = "http://localhost:5000";

const ServiceResultForm: React.FC<ServiceResultFormProps> = ({ item, onClose, onSave }) => {
    const isCompleted = item.service.status === "COMPLETED";

    const [resultText, setResultText] = useState(item.service.resultData || "");
    const [resultImg, setResultImg] = useState(item.service.resultImageUrl || "");
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setResultText(item.service.resultData || "");
        setResultImg(item.service.resultImageUrl || "");
        setAttachmentFile(null);
    }, [item]);

    const handleFileChange = (file: File | null) => {
        if (!file) return;
        const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
        if (!allowed.includes(file.type)) {
            alert("Chỉ hỗ trợ file .pdf, .jpg, .jpeg, .png");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("Tệp không được vượt quá 5MB");
            return;
        }
        setAttachmentFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0] || null;
        handleFileChange(file);
    };

    const handleSaveDraft = async () => {
        try {
            setSubmitting(true);
            await onSave("IN_PROGRESS", resultText, resultImg, attachmentFile);
            alert("Lưu nháp thành công!");
        } catch (err: any) {
            alert(err?.response?.data?.message || "Lỗi lưu kết quả");
        } finally {
            setSubmitting(false);
        }
    };

    const handleComplete = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn hoàn thành? Dữ liệu sẽ không thể chỉnh sửa sau khi hoàn thành.")) return;
        try {
            setSubmitting(true);
            await onSave("COMPLETED", resultText, resultImg, attachmentFile);
        } catch (err: any) {
            alert(err?.response?.data?.message || "Lỗi lưu kết quả");
            setSubmitting(false);
        }
    };

    // Existing saved attachment
    const savedAttachmentUrl = item.service.attachmentUrl;
    const savedAttachmentName = item.service.attachmentName;
    const isPdf = (name?: string) => name?.split(".").pop()?.toLowerCase() === "pdf";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className={`${isCompleted ? 'bg-blue-600' : 'bg-emerald-600'} p-6 text-white shrink-0`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold">Phiếu kết quả dịch vụ</h3>
                            <p className="text-white/80 text-sm mt-1">Bệnh nhân: <span className="font-bold text-white">{item?.patientName}</span></p>
                            <p className="text-white/80 text-xs mt-0.5">Dịch vụ: <span className="font-bold text-white">{item?.service?.serviceType}</span></p>
                        </div>
                        <button onClick={onClose} className="text-white hover:text-gray-200 p-1 rounded-lg hover:bg-white/10 transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 overflow-y-auto">
                    {isCompleted && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm">
                            Hồ sơ này đã <strong className="font-bold text-blue-800">Hoàn thành</strong>. Dữ liệu chỉ được xem và không thể chỉnh sửa.
                        </div>
                    )}

                    {/* Result text */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả / Kết luận (*)</label>
                        <textarea
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-600 min-h-[140px] text-black font-medium"
                            placeholder="Nhập kết quả chuyên môn..."
                            value={resultText}
                            onChange={(e) => setResultText(e.target.value)}
                            disabled={isCompleted || submitting}
                        />
                    </div>

                    {/* File upload area */}
                    {!isCompleted && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Tải lên tệp kết quả
                                <span className="text-xs font-normal text-gray-400 ml-2">(PDF, JPG, PNG – tối đa 5MB)</span>
                            </label>

                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all
                                    ${dragOver
                                        ? "border-emerald-400 bg-emerald-50"
                                        : attachmentFile
                                            ? "border-emerald-300 bg-emerald-50/50"
                                            : "border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50/30"
                                    }`}
                            >
                                {attachmentFile ? (
                                    <div className="flex items-center gap-3">
                                        <FileTypeIcon name={attachmentFile.name} />
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-gray-800 truncate max-w-[280px]">{attachmentFile.name}</p>
                                            <p className="text-xs text-gray-500">{(attachmentFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setAttachmentFile(null); }}
                                            className="ml-2 text-red-400 hover:text-red-600 transition"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-sm text-gray-500 font-medium">Kéo thả hoặc <span className="text-emerald-600 font-bold">nhấn để chọn</span> tệp</p>
                                        <p className="text-xs text-gray-400 mt-1">Hỗ trợ: PDF, JPG, PNG</p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            />
                        </div>
                    )}

                    {/* Existing saved attachment */}
                    {savedAttachmentUrl && (
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                            <FileTypeIcon name={savedAttachmentName || savedAttachmentUrl} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium">Tệp đã đính kèm</p>
                                <p className="text-sm font-bold text-gray-800 truncate">{savedAttachmentName || "Xem tệp"}</p>
                            </div>
                            <a
                                href={isPdf(savedAttachmentName || savedAttachmentUrl) ? `${API_BASE}${savedAttachmentUrl}` : `${API_BASE}${savedAttachmentUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition shrink-0"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Xem kết quả
                            </a>
                            <a
                                href={`${API_BASE}${savedAttachmentUrl}`}
                                download={savedAttachmentName || undefined}
                                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition shrink-0"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Tải về
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 flex gap-3 shrink-0 border-t border-gray-200 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition"
                    >
                        Đóng
                    </button>

                    {!isCompleted && (
                        <>
                            <button
                                onClick={handleSaveDraft}
                                disabled={submitting}
                                className="px-6 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition disabled:opacity-50"
                            >
                                Lưu Nháp
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={submitting || !resultText.trim()}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-200 disabled:opacity-50 disabled:bg-gray-400 disabled:shadow-none"
                            >
                                {submitting ? "Đang xử lý..." : "Hoàn thành & Chốt"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceResultForm;
