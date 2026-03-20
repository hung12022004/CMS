import React, { useRef, useState } from "react";
import { uploadAvatarApi } from "../../services/user.api";

const EditForm = ({ form, setForm, isEditing, onAvatarUpload }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const getRoleInfo = (role) => {
    const roleMap = {
      admin: { label: "Admin", color: "bg-red-100 text-red-700" },
      doctor: { label: "Doctor", color: "bg-blue-100 text-blue-700" },
      nurse: { label: "Nurse", color: "bg-green-100 text-green-700" },
      patient: { label: "Patient", color: "bg-gray-100 text-gray-700" },
    };
    return roleMap[role] || { label: "Unknown", color: "bg-gray-100 text-gray-700" };
  };

  const roleInfo = getRoleInfo(form.role);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    // Upload
    try {
      setUploading(true);
      const data = await uploadAvatarApi(file);
      setForm((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
      if (onAvatarUpload) onAvatarUpload(data.avatarUrl);
      alert("Upload avatar thành công!");
    } catch (err) {
      alert(err?.response?.data?.message || "Upload failed");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const getAvatarSrc = () => {
    if (previewUrl) return previewUrl;
    if (form.avatarUrl) {
      // Nếu là relative path từ server
      if (form.avatarUrl.startsWith("/uploads")) {
        return `http://localhost:5000${form.avatarUrl}`;
      }
      return form.avatarUrl;
    }
    return null;
  };


  return (
    <div className="grid grid-cols-2 gap-6 text-gray-900">
      {/* Role (read-only) */}
      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <div className={`px-4 py-2 rounded-xl border text-sm font-semibold ${roleInfo.color} cursor-not-allowed`}>
          {roleInfo.label}
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          disabled={!isEditing}
          className="input"
        />
      </div>

      {/* Nickname */}
      <div>
        <label className="block text-sm font-medium mb-1">Nick Name</label>
        <input
          name="nickname"
          value={form.nickname}
          onChange={handleChange}
          disabled={!isEditing}
          className="input"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium mb-1">Gender</label>
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          disabled={!isEditing}
          className="input"
        >
          <option value="unknown">Unknown</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium mb-1">Language</label>
        <select
          name="language"
          value={form.language}
          onChange={handleChange}
          disabled={!isEditing}
          className="input"
        >
          <option value="vi">Vietnamese</option>
          <option value="en">English</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
        </select>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-1">Phone Number</label>
        <input
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={handleChange}
          disabled={!isEditing}
          className="input"
        />
      </div>

      {/* Avatar Upload */}
      <div className="col-span-2">
        <label className="block text-sm font-medium mb-2">Avatar</label>
        <div className="flex items-center gap-4">
          {/* Preview */}
          {getAvatarSrc() && (
            <img
              src={getAvatarSrc()}
              alt="Avatar preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 shadow-sm"
            />
          )}

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={!isEditing || uploading}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isEditing || uploading}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 
                       bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {uploading ? "Uploading..." : "Chọn ảnh"}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">JPG, PNG, GIF, WebP (tối đa 5MB)</p>
      </div>
    </div>
  );
};

export default EditForm;
