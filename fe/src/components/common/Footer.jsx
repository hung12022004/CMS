export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-6xl px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Brand */}
        <div>
          <h2 className="text-5xl font-extrabold text-white tracking-tight">
            CMS
          </h2>
          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            Clinic Management System – nền tảng quản lý phòng khám hiện đại,
            tối ưu trải nghiệm cho bác sĩ và bệnh nhân.
          </p>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
            Contact
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Email: <span className="text-gray-300">cms@clinic.dev</span></li>
            <li>Phone: <span className="text-gray-300">+84 999 888 777</span></li>
            <li>Address: <span className="text-gray-300">Somewhere on Earth</span></li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <p>
            © {new Date().getFullYear()} CMS – Clinic Management System. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
