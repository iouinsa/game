"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function BigScreen() {
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase
        .from("teams")
        .select("*")
        .order("score", { ascending: false });
      if (data) setTeams(data);
    };
    fetchTeams();

    const channel = supabase.channel('screen_leaderboard')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const medals = ['🥇', '🥈', '🥉'];
  const bgColors = ['bg-yellow-400', 'bg-gray-200', 'bg-orange-300'];

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 p-8 flex flex-col items-center justify-center">
      <h2 className="text-5xl font-bold text-white text-center mb-12">🏆 Leaderboard</h2>

      <div className="w-full max-w-3xl space-y-4">
        {teams.map((team, index) => {
          const isTop3 = index < 3;
          const bgClass = isTop3 ? bgColors[index] : 'bg-white';
          
          return (
            <div key={team.id} className={`${bgClass} rounded-3xl p-6 flex items-center gap-6 shadow-2xl transition-transform ${index === 0 ? 'scale-105' : ''}`}>
              <div className="text-5xl font-bold w-16 text-center">
                {isTop3 ? medals[index] : `#${index + 1}`}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 truncate text-3xl">{team.name}</div>
              </div>
              <div className="text-4xl font-bold text-gray-800 flex-shrink-0">
                {team.score}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}