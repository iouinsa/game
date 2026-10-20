"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { supabase } from "../../lib/supabase";

export default function LoginPeserta() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  // AUTO LOGIN: Kalau udah pernah login, lempar ke Home
  useEffect(() => {
    const team = localStorage.getItem("team_code");
    const nick = localStorage.getItem("nickname");
    if (team && nick) {
      router.push("/peserta/home");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !nickname) return alert("Isi kode tim dan nickname dulu ya!");
    setLoading(true);

    const teamCode = code.toUpperCase();

    try {
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id")
        .eq("code", teamCode)
        .single();

      if (teamError || !teamData) {
        throw new Error("Kode tim tidak valid! Cek lagi kodenya.");
      }

      const { error: memberError } = await supabase
        .from("team_members")
        .upsert(
          { team_id: teamData.id, nickname: nickname }, 
          { onConflict: 'team_id,nickname' }
        );

      if (memberError) throw new Error("Gagal mendaftarkan nama: " + memberError.message);

      localStorage.setItem("team_code", teamCode);
      localStorage.setItem("nickname", nickname);
      
      alert(`✅ Masuk sebagai ${nickname}`);
      router.push("/peserta/home");
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
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
          <div className="bg-gradient-to-br from-[#065f46] to-[#047857] text-white p-8 text-center">
            <div className="text-5xl mb-3">👥</div>
            <h1 className="text-xl font-bold">Masuk Peserta</h1>
          </div>
          <form onSubmit={handleLogin} className="p-5">
            <label className="block text-sm font-medium mb-1">Kode Tim</label>
            <input 
              type="text" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="KAKTUS" 
              className="w-full border-2 border-gray-200 rounded-xl p-3 mb-4 text-center text-2xl font-mono font-bold tracking-widest uppercase focus:border-green-500 outline-none text-black"
            />
            
            <label className="block text-sm font-medium mb-1">Nickname kamu</label>
            <input 
              type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
              placeholder="Andi" 
              className="w-full border rounded-xl p-3 mb-2 focus:border-green-500 outline-none text-black"
            />
            
            <button 
              type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl p-4 font-semibold transition active:scale-95 mt-4"
            >
              {loading ? "Memeriksa..." : "Masuk →"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}