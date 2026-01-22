import { useEffect, useState } from "react";
import { meApi } from "../services/auth.api";

export default function HomePage() {
  const hasToken = !!localStorage.getItem("accessToken");

  const [me, setMe] = useState(null);
  const [status, setStatus] = useState(hasToken ? "loading" : "unauth"); 
  // idle/loading/ok/unauth/error

  useEffect(() => {
    if (!hasToken) return; // không setState ở đây nữa

    let cancelled = false;

    (async () => {
      try {
        const data = await meApi();
        if (cancelled) return;
        setMe(data.user);
        setStatus("ok");
      } catch {
        if (cancelled) return;
        setStatus("unauth");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8">
        <h1 className="text-3xl font-bold">Home</h1>

        <div className="mt-6 rounded-xl bg-black/30 border border-white/10 p-4">
          {status === "loading" && <p>Đang gọi /auth/me ...</p>}
          {status === "unauth" && <p>Bạn chưa đăng nhập (hoặc token hết hạn).</p>}
          {status === "ok" && me && (
            <div>
              <p className="font-semibold">Xin chào, {me.name || "User"} ✅</p>
              <p className="text-sm text-slate-400">Email: {me.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
