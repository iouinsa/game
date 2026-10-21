"use client";

import { useRouter } from "next/navigation";
import Header from "./components/Header";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center fade-in">
        
        {/* LOGO PNG */}
        <img src="/logo.png" alt="Logo" className="w-32 h-32 object-contain mb-4" />
        
        {/* JUDUL */}
        <h1 className="text-4xl font-bold text-green-900 mb-2 drop-shadow-sm">Photo Hunt</h1>
        
        {/* SUBJUDUL PUTIH */}
        <p className="text-sm text-white font-medium mb-12 drop-shadow-sm">Kebun Raya · IO UINSA</p>

        <button 
          onClick={() => router.push("/login")}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 font-bold text-lg shadow-lg transition active:scale-95 mb-4 flex items-center justify-center gap-2 border-2 border-green-700"
        >
          <span className="text-2xl">👥</span> Participant Login
        </button>
        
        <button 
          onClick={() => router.push("/admin/login")}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-2xl p-4 font-bold text-lg shadow-lg transition active:scale-95 flex items-center justify-center gap-2 border-2 border-gray-900"
        >
          <span className="text-2xl">🎛️</span> Committee Login
        </button>
      </main>
    </>
  );
}