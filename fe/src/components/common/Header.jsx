import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        <div
          className="text-lg font-bold cursor-pointer"
          onClick={() => navigate("/")}
        >
          CMS
        </div>

        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:opacity-90"
        >
          Sign in
        </button>
      </div>
    </header>
  );
}
