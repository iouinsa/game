"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header"; 

export default function LoginAdmin() {
  const router = useRouter();
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === "iouinsa2026") {
      localStorage.setItem("is_admin", "true");
      router.push("/admin/dashboard"); 
    } else {
      alert("❌ Password salah! Pastikan huruf kecil semua.");
      setPassword("");
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 p-4 pt-8 overflow-y-auto fade-in">
        <button onClick={() => router.push("/")} className="text-gray-500 font-semibold mb-4 flex items-center gap-1 active:scale-95">
          ← Kembali
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gray-800 text-white p-8 text-center">
            <div className="text-5xl mb-3">🎛️</div>
            <h1 className="text-xl font-bold">Masuk Panitia</h1>
          </div>
          
          <form onSubmit={handleLogin} className="p-5">
            <label className="block text-sm font-medium mb-1">Password Panitia</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full border-2 border-gray-200 rounded-xl p-3 mb-4 focus:border-gray-800 outline-none text-black"
            />
            
            <button 
              type="submit"
              className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-xl p-4 font-semibold transition active:scale-95"
            >
              Masuk Admin
            </button>
          </form>
        </div>
      </main>
    </>
  );
}