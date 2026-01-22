import { useEffect, useState } from "react";
import { updateProfileApi } from "../services/user.api";

import AvatarCard from "../components/profile/AvatarCard";
import EditForm from "../components/profile/EditForm";
import { useAuth } from "../hooks/useAuth";

export default function ProfilePage() {
  const { user, loading, refreshMe } = useAuth();

  const [form, setForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  const handleEditToggle = async () => {
    // 👉 bật chế độ edit
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setSaving(true);

      // 👉 update BE
      await updateProfileApi(form);

      // 🔥 fetch lại user từ /me
      await refreshMe();

      setIsEditing(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-700 p-10">Loading profile...</p>;
  }

  if (!user) {
    return <p className="text-gray-700 p-10">Bạn chưa đăng nhập</p>;
  }

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl rounded-2xl bg-white border border-gray-200 p-9 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">
          Quản lý thông tin cá nhân của bạn
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <AvatarCard
            user={user}
            isEditing={isEditing}
            saving={saving}
            onEditToggle={handleEditToggle}
          />

          <EditForm
            form={form}
            setForm={setForm}
            isEditing={isEditing}
          />
        </div>
      </div>
    </div>
  );
}
