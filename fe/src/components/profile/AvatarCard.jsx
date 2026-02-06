const AvatarCard = ({ user, isEditing, onEditToggle, saving }) => {
  // Helper function để xử lý avatar URL
  const getAvatarSrc = () => {
    if (!user.avatarUrl) {
      return "https://i.pinimg.com/originals/c6/e5/65/c6e56503cfdd87da299f72dc416023d4.jpg";
    }
    // Nếu là relative path từ server (upload từ máy)
    if (user.avatarUrl.startsWith("/uploads")) {
      return `http://localhost:5000${user.avatarUrl}`;
    }
    // Nếu là full URL (từ Google hoặc link khác)
    return user.avatarUrl;
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <img
          src={getAvatarSrc()}
          alt="avatar"
          className="w-20 h-20 rounded-full object-cover border border-gray-200"
        />

        <div>
          <p className="text-gray-900 font-semibold">
            {user.name || "User"}
          </p>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </div>

      <button
        onClick={onEditToggle}
        disabled={saving}
        className={`px-4 py-2 rounded-lg text-white font-medium transition
          ${isEditing
            ? "bg-green-500 hover:bg-green-600"
            : "bg-blue-500 hover:bg-blue-600"
          }
          disabled:opacity-60
        `}
      >
        {saving ? "Updating..." : isEditing ? "Update" : "Edit"}
      </button>
    </div>
  );
};

export default AvatarCard;
