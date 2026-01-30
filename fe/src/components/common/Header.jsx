import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Header() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/login", { replace: true });
  };

  /* =======================
     ⏳ LOADING STATE
     ======================= */
  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-2xl">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="w-40 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </header>
    );
  }

  /* =======================
     ❌ NOT LOGIN
     ======================= */
  if (!user) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-2xl">
        <div className="mx-auto max-w-5xl px-4 py-4 flex justify-between">
          <p
            onClick={() => navigate("/")}
            className="font-poppins font-bold text-4xl text-gray-900 cursor-pointer"
          >
            Clinic MS
          </p>

          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100"
          >
            Đăng nhập
          </button>
        </div>
      </header>
    );
  }

  /* =======================
     ✅ LOGGED IN
     ======================= */
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-2xl">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <p
          onClick={() => navigate("/")}
          className="font-poppins font-bold text-4xl text-gray-900 cursor-pointer"
        >
          Clinic MS
        </p>

        {/* Dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition"
          >
            <img
              src={user.avatarUrl || "https://i.pravatar.cc/100"}
              className="w-10 h-10 rounded-full object-cover border"
              alt="avatar"
            />
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${
                open ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Menu */}
          <div
            className={`
              absolute right-0 mt-3 w-64
              bg-white border border-gray-200
              rounded-2xl shadow-xl
              transform transition-all duration-200 origin-top-right
              ${
                open
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }
            `}
          >
            {/* User info */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200">
              <img
                src={user.avatarUrl || "https://i.pravatar.cc/100"}
                className="w-10 h-10 rounded-full object-cover"
                alt="avatar"
              />
              <div>
                <p className="text-gray-900 font-semibold">
                  {user.name || "User"}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
            >
              Hồ sơ của tôi
            </button>

            <button
              onClick={() => {
                setOpen(false);
                navigate("/change-password");
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
            >
              Đổi mật khẩu
            </button>

            <div className="border-t border-gray-200" />

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-b-2xl "
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
