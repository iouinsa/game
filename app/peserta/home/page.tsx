"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { supabase } from "../../../lib/supabase";
import { getSession, formatTime } from "../../../lib/helpers";

export default function PesertaHome() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [teamScore, setTeamScore] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const nick = localStorage.getItem("nickname");
    const team = localStorage.getItem("team_code");
    
    if (!nick || !team) {
      router.push("/login");
      return;
    }
    
    setNickname(nick);
    setTeamCode(team);

    const checkStatus = setInterval(async () => {
      const { data } = await supabase.from("session_settings").select("is_finished").eq("id", 1).single();
      if (data && data.is_finished) {
        clearInterval(checkStatus);
        router.push("/peserta/rank");
      }
    }, 2000);

    const fetchData = async () => {
      try {
        const { data: sessionData } = await getSession();
        if (sessionData) setSession(sessionData);

        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("id, score")
          .eq("code", team)
          .single();

        if (teamError || !teamData) return;
        setTeamScore(teamData.score);

        const { data: subs, error: subsError } = await supabase
          .from("submissions")
          .select(`*, objects ( name )`)
          .eq("team_id", teamData.id)
          .order("created_at", { ascending: false });

        if (!subsError && subs) setSubmissions(subs);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();

    const channel = supabase.channel(`peserta_${team}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_settings' }, (payload) => {
        // PERBAIKAN: Hanya timpa state kalau Admin nge-pause, nge-play, atau reset
        // Kalau cuma update detik biasa, abaikan (biar timer lokal kita yang jalan)
        setSession((prev: any) => {
          if (!prev) return payload.new;
          
          const needsReset = payload.new.is_paused !== prev.is_paused || 
                             payload.new.is_running !== prev.is_running || 
                             payload.new.is_finished !== prev.is_finished ||
                             payload.new.remaining_seconds > (prev.remaining_seconds + 2); // Deteksi kalau di-reset
                             
          if (needsReset) {
            return payload.new;
          }
          return prev;
        });

        if (payload.new.is_finished) {
          router.push("/peserta/rank");
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, (payload) => {
        if (payload.new.code === team) setTeamScore(payload.new.score);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, () => {
        fetchData(); 
      })
      .subscribe();

    // Detak Timer Lokal (Jalan tiap 1 detik)
    localTimerRef.current = setInterval(() => {
      setSession((prev: any) => {
        if (prev && prev.is_running && !prev.is_paused && !prev.is_finished && prev.remaining_seconds > 0) {
          return { ...prev, remaining_seconds: prev.remaining_seconds - 1 };
        }
        return prev;
      });
    }, 1000);

    return () => { 
      supabase.removeChannel(channel); 
      if (localTimerRef.current) clearInterval(localTimerRef.current);
      clearInterval(checkStatus);
    };
  }, [router]);

  return (
    <>
      <Header />
      <main className="flex-1 overflow-y-auto fade-in pb-4">
        <div className="bg-white p-4 shadow-sm flex justify-between items-center mb-4">
          <div>
            <h1 className="text-lg font-bold text-green-800">Tim {teamCode}</h1>
            <p className="text-xs text-gray-500">Halo, {nickname}!</p>
          </div>
        </div>

        <div className="px-4">
          <div className="bg-white rounded-2xl shadow p-4 mb-4 flex justify-between items-center border-l-4 border-green-600">
            <div>
              <div className="text-xs text-gray-500 font-semibold mb-1">Total Poin Tim</div>
              <div className="text-3xl font-bold text-green-600">{teamScore}</div>
            </div>
            <div className="text-4xl text-green-200">🏆</div>
          </div>

          {session ? (
            <div className={`rounded-2xl p-4 text-center text-white shadow-lg mb-4 transition-colors ${session.remaining_seconds < 300 ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`}>
              <div className="text-xs opacity-80 mb-1">⏱ Sisa Waktu</div>
              <div className="text-4xl font-bold font-mono">{formatTime(session.remaining_seconds)}</div>
              <div className="text-xs opacity-80 mt-1">dari {session.duration_minutes} menit</div>
            </div>
          ) : (
            <div className="bg-gray-200 animate-pulse h-24 rounded-2xl mb-4"></div>
          )}

          <button 
            onClick={() => {
              if (session?.is_finished) return alert("Waktu sudah habis!");
              router.push('/peserta/hunting');
            }} 
            className={`w-full text-white rounded-2xl p-5 mb-3 font-bold text-xl shadow-lg transition flex items-center justify-center gap-3 ${
              session?.is_finished ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 active:scale-95'
            }`}
          >
            <span className="text-3xl">📸</span> HUNTING
          </button>
          
          <button 
            onClick={() => {
              if (session?.is_finished) return alert("Waktu sudah habis!");
              router.push('/peserta/quiz');
            }} 
            className={`w-full text-white rounded-2xl p-4 mb-6 font-bold text-lg shadow-lg transition flex items-center justify-center gap-3 ${
              session?.is_finished ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
            }`}
          >
            <span className="text-2xl">📝</span> QUIZ
          </button>

          <h3 className="font-bold text-sm text-gray-800 mb-3">📷 Feed Foto Tim Kamu</h3>
          
          {submissions.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-sm text-gray-400 shadow">
              Belum ada foto. Yuk mulai hunting!
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map(sub => (
                <div key={sub.id} className="bg-white rounded-2xl shadow overflow-hidden">
                  <img src={sub.photo_url} alt="Foto" className="w-full h-48 object-cover bg-gray-200" />
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="font-bold text-sm text-gray-800">{sub.objects?.name || 'Objek'}</div>
                        <div className="text-xs text-gray-500">
                          Diunggah oleh: <span className="font-semibold">{sub.uploader_name || 'Anggota'}</span>
                        </div>
                      </div>
                      {sub.status === 'approved' && (
                        <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex-shrink-0">
                          +{sub.points_awarded} Poin
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded line-clamp-2 mt-2">
                      {sub.fun_fact}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
