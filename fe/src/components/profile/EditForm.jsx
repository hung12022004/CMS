import React from "react";

const EditForm = ({ form, setForm, isEditing }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="grid grid-cols-2 gap-6 text-gray-900">
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

      {/* Avatar URL */}
      <div>
        <label className="block text-sm font-medium mb-1">Avatar URL</label>
        <input
          name="avatarUrl"
          value={form.avatarUrl}
          onChange={handleChange}
          disabled={!isEditing}
          className="input"
        />
      </div>
    </div>
  );
};

export default EditForm;
