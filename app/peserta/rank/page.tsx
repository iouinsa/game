"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { supabase } from "../../../lib/supabase";

export default function HalamanRank() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccessAndFetch = async () => {
      // Cek apakah yang buka ini Panitia
      const isAdmin = localStorage.getItem("is_admin") === "true";

      // 1. Kalau BUKAN admin, cek apakah leaderboard udah dibuka
      if (!isAdmin) {
        const { data: sessionData } = await supabase
          .from("session_settings")
          .select("show_leaderboard")
          .eq("id", 1)
          .single();

        if (sessionData && !sessionData.show_leaderboard) {
          alert("⏳ Leaderboard belum dibuka oleh panitia. Tunggu instruksi ya!");
          router.push("/peserta/home");
          return;
        }
      }

      // 2. Ambil data peringkat
      const { data } = await supabase
        .from("teams")
        .select("*")
        .order("score", { ascending: false });
        
      if (data) setTeams(data);
      setLoading(false);
    };

    checkAccessAndFetch();

    // 3. Realtime update
    const channel = supabase.channel('leaderboard_peserta')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, () => {
        checkAccessAndFetch();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const medals = ['🥇', '🥈', '🥉'];
  const bgColors = ['bg-yellow-400', 'bg-gray-200', 'bg-orange-300'];

  return (
    <>
      <Header />
      <main className="flex-1 p-4 overflow-y-auto fade-in bg-gradient-to-br from-green-800 to-green-600">
        <h2 className="text-2xl font-bold text-white text-center mb-6 mt-4">🏆 Leaderboard</h2>

        {loading ? (
          <div className="text-center text-white mt-10">Memuat...</div>
        ) : (
          <div className="space-y-3 max-w-md mx-auto">
            {teams.map((team, index) => {
              const isTop3 = index < 3;
              const bgClass = isTop3 ? bgColors[index] : 'bg-white';
              
              return (
                <div key={team.id} className={`${bgClass} rounded-2xl p-4 flex items-center gap-4 shadow-lg transition-transform ${index === 0 ? 'scale-105' : ''}`}>
                  <div className="text-3xl font-bold w-8 text-center">
                    {isTop3 ? medals[index] : `#${index + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 truncate text-lg">{team.name}</div>
                    <div className="text-xs text-gray-600">Tim {team.code}</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800 flex-shrink-0">
                    {team.score}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}