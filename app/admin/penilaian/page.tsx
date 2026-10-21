"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { supabase } from "../../../lib/supabase";

export default function AdminPenilaianList() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          submissions ( id, status )
        `)
        .order("name", { ascending: true });

      if (data) setTeams(data);
      if (error) console.error(error);
      setLoading(false);
    };
    fetchTeams();
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 p-4 overflow-y-auto fade-in bg-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.push('/admin/dashboard')} className="text-green-700 text-2xl">←</button>
          <h2 className="text-xl font-bold text-green-800">Select Team to Assess</h2>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 mt-10">Loading data...</div>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => {
              const pendingCount = team.submissions?.filter((s: any) => s.status === 'pending').length || 0;
              
              return (
                <div 
                  key={team.id} 
                  onClick={() => router.push(`/admin/penilaian/${team.id}`)}
                  className="bg-white rounded-xl shadow p-4 flex justify-between items-center cursor-pointer active:scale-95 transition hover:shadow-md"
                >
                  <div>
                    <div className="font-bold text-gray-800 text-lg">{team.name}</div>
                    <div className="text-xs text-gray-500">Total {team.submissions?.length || 0} Photos</div>
                  </div>
                  
                  {pendingCount > 0 ? (
                    <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {pendingCount} Pending
                    </div>
                  ) : (
                    <div className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                      Completed
                    </div>
                  )}
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