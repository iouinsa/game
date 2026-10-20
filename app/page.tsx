"use client";

import { useRouter } from "next/navigation";
import Header from "./components/Header";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center fade-in">
        <div className="text-7xl mb-6">🌿</div>
        <h1 className="text-3xl font-bold text-green-800 mb-2">Photo Hunt</h1>
        <p className="text-sm text-gray-500 mb-12">Kebun Raya · IO UINSA</p>

        <button 
          onClick={() => router.push("/login")}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 font-bold text-lg shadow-lg transition active:scale-95 mb-4 flex items-center justify-center gap-2"
        >
          <span className="text-2xl">👥</span> Masuk Peserta
        </button>
        
        <button 
          onClick={() => router.push("/admin/login")}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-2xl p-4 font-bold text-lg shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
        >
          <span className="text-2xl">🎛️</span> Masuk Panitia
        </button>
      </main>
    </>
  );
}