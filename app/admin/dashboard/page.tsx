"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { supabase } from "../../../lib/supabase";
import { getSession, updateSession, formatTime } from "../../../lib/helpers";

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      const { data, error } = await getSession();
      if (isMounted) {
        if (error) setErrorMsg((error as any).message);
        else setSession(data);
        setLoading(false);
      }
    };
    initSession();

    const channel = supabase.channel('session_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_settings' }, (payload) => {
        if (isMounted) setSession(payload.new);
      }).subscribe();

    return () => { 
      isMounted = false; 
      supabase.removeChannel(channel); 
    };
  }, []);

  // MESIN TIMER ADMIN
  useEffect(() => {
    timerRef.current = setInterval(async () => {
      const { data } = await supabase.from("session_settings").select("*").eq("id", 1).single();
      
      if (data) {
        setSession((prev: any) => {
          if (!prev) return data;
          if (prev.is_running !== data.is_running || prev.is_paused !== data.is_paused || prev.remaining_seconds !== data.remaining_seconds) {
            return data;
          }
          return prev;
        });

        if (data.is_running && !data.is_paused && !data.is_finished && data.remaining_seconds > 0) {
          await supabase.from("session_settings")
            .update({ remaining_seconds: data.remaining_seconds - 1 })
            .eq("id", 1);
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePlay = async () => {
    setSession((prev: any) => ({ ...prev, is_running: true, is_paused: false, is_finished: false }));
    await updateSession({ is_paused: false, is_running: true, is_finished: false });
  };

  const handlePause = async () => {
    setSession((prev: any) => ({ ...prev, is_running: false, is_paused: true }));
    await updateSession({ is_running: false, is_paused: true });
  };

  const handleReset = async () => {
    const durasi = session?.duration_minutes || 40;
    setSession((prev: any) => ({ ...prev, is_running: false, is_paused: false, is_finished: false, remaining_seconds: durasi * 60 }));
    await updateSession({ is_running: false, is_paused: false, is_finished: false, remaining_seconds: durasi * 60 });
  };

  const handleStop = async () => {
    if (!confirm("Hentikan waktu dan tampilkan skor akhir?")) return;
    setSession((prev: any) => ({ ...prev, is_running: false, is_paused: false, is_finished: true, remaining_seconds: 0 }));
    await updateSession({ is_running: false, is_paused: false, is_finished: true, remaining_seconds: 0 });
    alert("🏁 Waktu telah dihentikan! Peserta sekarang melihat layar Rank.");
  };

  const handleSetDuration = async () => {
    const durasi = session?.duration_minutes || 40;
    setSession((prev: any) => ({ ...prev, is_running: false, is_paused: false, is_finished: false, remaining_seconds: durasi * 60 }));
    await updateSession({ is_running: false, is_paused: false, is_finished: false, remaining_seconds: durasi * 60 });
  };

  const handleLogout = () => {
    localStorage.removeItem("is_admin");
    router.push("/");
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  if (!session || errorMsg) return <div className="p-8 text-center text-red-500">Gagal load data.</div>;

  const isPlaying = session.is_running && !session.is_paused && !session.is_finished;

  return (
    <>
      <Header />
      <main className="flex-1 p-4 overflow-y-auto fade-in">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800">🎛️ Panel Panitia</h1>
          <button onClick={handleLogout} className="text-red-500 font-semibold text-xs border border-red-500 px-3 py-1 rounded-lg">Keluar</button>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="text-sm font-semibold mb-3">⏱ Kontrol Timer</div>
          
          <div className={`rounded-xl p-4 text-center mb-4 text-white transition-colors ${session.remaining_seconds < 300 ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`}>
            <div className="text-3xl font-bold font-mono">{formatTime(session.remaining_seconds)}</div>
            <div className="text-xs opacity-80">dari {session.duration_minutes} menit</div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={handlePlay} disabled={isPlaying} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg p-2 text-xs font-bold transition active:scale-95">▶ Play</button>
            <button onClick={handlePause} disabled={!isPlaying} className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-lg p-2 text-xs font-bold transition active:scale-95">⏸ Pause</button>
            <button onClick={handleStop} className="bg-gray-800 hover:bg-gray-900 text-white rounded-lg p-2 text-xs font-bold transition active:scale-95">⏹ Stop</button>
            <button onClick={handleReset} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-2 text-xs font-bold transition active:scale-95">🔄 Reset</button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600 mt-2 mb-4">
            <span>Set Durasi:</span>
            <input type="number" value={session.duration_minutes} onChange={(e) => setSession({ ...session, duration_minutes: Number(e.target.value) })} className="border rounded p-1 w-16 text-center text-sm outline-none text-black"/>
            <span>menit</span>
            <button onClick={handleSetDuration} className="bg-gray-200 hover:bg-gray-300 rounded p-1 px-3 font-semibold ml-auto transition">Set</button>
          </div>

          {/* SWITCH LEADERBOARD */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <div className="text-sm font-semibold text-gray-800">Tampilkan Rank ke Peserta</div>
              <div className="text-xs text-gray-500">Peserta bisa lihat peringkat</div>
            </div>
            <button 
              onClick={async () => {
                setSession((prev: any) => ({ ...prev, show_leaderboard: !prev.show_leaderboard }));
                await updateSession({ show_leaderboard: !session.show_leaderboard });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${session.show_leaderboard ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${session.show_leaderboard ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </button>
          </div>

          {/* SWITCH LOGOUT PESERTA (BARU) */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
            <div>
              <div className="text-sm font-semibold text-gray-800">Izinkan Peserta Keluar</div>
              <div className="text-xs text-gray-500">Tampilkan tombol logout di HP</div>
            </div>
            <button 
              onClick={async () => {
                setSession((prev: any) => ({ ...prev, show_logout: !prev.show_logout }));
                await updateSession({ show_logout: !session.show_logout });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${session.show_logout ? 'bg-red-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${session.show_logout ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </button>
          </div>
        </div>

        {/* TOMBOL MENU */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push('/admin/penilaian')} className="bg-white p-4 rounded-xl shadow flex flex-col items-center justify-center gap-2 active:scale-95 transition border border-gray-100">
              <span className="text-3xl">📝</span>
              <span className="text-sm font-bold text-gray-800">Penilaian Foto</span>
            </button>
            
            <button onClick={() => router.push('/admin/kelola-objek')} className="bg-white p-4 rounded-xl shadow flex flex-col items-center justify-center gap-2 active:scale-95 transition border border-gray-100">
              <span className="text-3xl">📋</span>
              <span className="text-sm font-bold text-gray-800">Beri Tugas</span>
            </button>
          </div>

          <button onClick={() => router.push('/admin/quiz')} className="w-full bg-white p-4 rounded-xl shadow flex items-center justify-center gap-3 active:scale-95 transition border border-gray-100">
            <span className="text-3xl">❓</span>
            <span className="text-sm font-bold text-gray-800">Kelola Soal Quiz</span>
          </button>
        </div>
      </main>
      <BottomNav />
    </>
  );
}