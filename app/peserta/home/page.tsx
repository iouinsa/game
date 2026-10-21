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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fungsi Ambil Data (Dipindah ke luar useEffect biar bisa dipanggil tombol)
  const fetchData = async () => {
    const team = localStorage.getItem("team_code");
    if (!team) return;

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

  // Fungsi Khusus Tombol Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 800); // Animasi muter 0.8 detik
  };

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

    fetchData();

    const channel = supabase.channel(`peserta_${team}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_settings' }, (payload) => {
        setSession((prev: any) => {
          if (!prev) return payload.new;
          const needsReset = payload.new.is_paused !== prev.is_paused || 
                             payload.new.is_running !== prev.is_running || 
                             payload.new.is_finished !== prev.is_finished ||
                             payload.new.remaining_seconds > (prev.remaining_seconds + 2);
          if (needsReset) return payload.new;
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

    // MESIN TIMER PESERTA
    localTimerRef.current = setInterval(async () => {
      const { data } = await supabase.from("session_settings").select("*").eq("id", 1).single();
      
      if (data) {
        setSession((prev: any) => {
          if (!prev) return data;
          if (prev.is_running !== data.is_running || prev.is_paused !== data.is_paused || prev.is_finished !== data.is_finished) {
            return data;
          }
          if (data.remaining_seconds < prev.remaining_seconds) {
             return data;
          }
          return prev;
        });
      }
    }, 1000);

    return () => { 
      supabase.removeChannel(channel); 
      if (localTimerRef.current) clearInterval(localTimerRef.current);
      clearInterval(checkStatus);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("nickname");
    localStorage.removeItem("team_code");
    router.push("/");
  };

  return (
    <>
      <Header />
      <main className="flex-1 overflow-y-auto fade-in pb-4">
        <div className="bg-white p-4 shadow-sm flex justify-between items-center mb-4">
          <div>
            <h1 className="text-lg font-bold text-green-800">Team {teamCode}</h1>
            <p className="text-xs text-gray-500">Hello, {nickname}!</p>
          </div>
          {session?.show_logout && (
            <button onClick={handleLogout} className="text-red-500 font-semibold text-xs border border-red-500 px-3 py-1 rounded-lg">
              Logout
            </button>
          )}
        </div>

        <div className="px-4">
          {/* KARTU POIN TIM (DENGAN TOMBOL REFRESH) */}
          <div className="bg-white rounded-2xl shadow p-4 mb-4 flex justify-between items-center border-l-4 border-green-600">
            <div>
              <div className="text-xs text-gray-500 font-semibold mb-1 flex items-center gap-2">
                Total Team Score
                {/* TOMBOL REFRESH */}
                <button 
                  onClick={handleRefresh} 
                  className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1 rounded-full transition-all"
                  title="Refresh Score"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 transition-transform duration-500 ${isRefreshing ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <div className="text-3xl font-bold text-green-600">{teamScore}</div>
            </div>
            <div className="text-4xl text-green-200">🏆</div>
          </div>

          {session ? (
            <div className={`rounded-2xl p-4 text-center text-white shadow-lg mb-4 transition-colors ${session.remaining_seconds < 300 ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`}>
              <div className="text-xs opacity-80 mb-1">Time Left</div>
              <div className="text-4xl font-bold font-mono">{formatTime(session.remaining_seconds)}</div>
              <div className="text-xs opacity-80 mt-1">of {session.duration_minutes} minutes</div>
            </div>
          ) : (
            <div className="bg-gray-200 animate-pulse h-24 rounded-2xl mb-4"></div>
          )}

          <button 
            onClick={() => {
              if (session?.is_finished) return alert("Time is up!");
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
              if (session?.is_finished) return alert("Time is up!");
              router.push('/peserta/quiz');
            }} 
            className={`w-full text-white rounded-2xl p-4 mb-6 font-bold text-lg shadow-lg transition flex items-center justify-center gap-3 ${
              session?.is_finished ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
            }`}
          >
            <span className="text-2xl">📝</span> QUIZ
          </button>

          <h3 className="font-bold text-sm text-gray-800 mb-3">📷 Your Team's Photos</h3>
          
          {submissions.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-sm text-gray-400 shadow">
              No photos yet. Let's start hunting!
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map(sub => (
                <div key={sub.id} className="bg-white rounded-2xl shadow overflow-hidden">
                  <img src={sub.photo_url} alt="Photo" className="w-full h-48 object-cover bg-gray-200" />
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="font-bold text-sm text-gray-800">{sub.objects?.name || 'Object'}</div>
                        <div className="text-xs text-gray-500">
                          Uploaded by: <span className="font-semibold">{sub.uploader_name || 'Member'}</span>
                        </div>
                      </div>
                      
                      {sub.status === 'approved' && (
                        <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex-shrink-0">
                          +{sub.points_awarded} Points
                        </div>
                      )}
                      {sub.status === 'partial' && (
                        <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold flex-shrink-0">
                          +{sub.points_awarded} Points (Partial)
                        </div>
                      )}
                      {sub.status === 'rejected' && (
                        <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold flex-shrink-0">
                          Rejected
                        </div>
                      )}
                      {sub.status === 'pending' && (
                        <div className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold flex-shrink-0">
                          Pending
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
