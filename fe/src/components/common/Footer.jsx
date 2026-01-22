export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-5xl px-4 py-4 text-sm text-slate-400">
        © {new Date().getFullYear()} FE Auth Demo
      </div>
    </footer>
  );
}
