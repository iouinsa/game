import Image from "next/image";

export default function Header() {
  return (
    <header className="bg-gradient-to-br from-[#065f46] to-[#047857] text-white px-4 py-3 flex items-center gap-3 shadow-md z-40 flex-shrink-0 sticky top-0">
      
      {/* Logo UINSA */}
      <div className="w-[38px] h-[38px] flex items-center justify-center flex-shrink-0 bg-white/10 rounded-lg p-1">
        <img src="/logo.png" alt="Logo UINSA" className="w-full h-full object-contain" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold leading-tight truncate">International Office</div>
        <div className="text-[11px] opacity-80 leading-tight truncate">UIN Sunan Ampel Surabaya</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[10px] opacity-70 leading-tight">Photo Hunt</div>
        <div className="text-xs font-bold leading-tight">Kebun Raya 🌿</div>
      </div>
    </header>
  );
}