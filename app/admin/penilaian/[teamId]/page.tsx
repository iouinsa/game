"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "../../../components/Header";
import BottomNav from "../../../components/BottomNav";
import { supabase } from "../../../../lib/supabase";

export default function AdminPenilaianDetail() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  
  const [team, setTeam] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [teamId]);

  const fetchData = async () => {
    const { data: teamData } = await supabase.from("teams").select("name").eq("id", teamId).single();
    if (teamData) setTeam(teamData);

    const { data: subData } = await supabase
      .from("submissions")
      .select(`*, objects ( name, points )`)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (subData) setSubmissions(subData);
    setLoading(false);
  };

  const handleReview = async (id: string, status: string, pointsToAdd: number) => {
    const { error: subError } = await supabase
      .from("submissions")
      .update({ status: status, points_awarded: pointsToAdd })
      .eq("id", id);

    if (subError) return alert("Failed to update: " + subError.message);

    if (status === "approved" || status === "partial") {
      const { data: teamData } = await supabase.from("teams").select("score").eq("id", teamId).single();
      if (teamData) {
        await supabase.from("teams").update({ score: teamData.score + pointsToAdd }).eq("id", teamId);
      }
    }

    alert(`✅ Assessment saved!`);
    fetchData();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading data...</div>;

  return (
    <>
      <Header />
      <main className="flex-1 p-4 overflow-y-auto fade-in bg-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.push('/admin/penilaian')} className="text-green-700 text-2xl">←</button>
          <h2 className="text-xl font-bold text-green-800">Assess: {team?.name}</h2>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow text-gray-500">
            This team hasn't uploaded any photos yet.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-xl shadow overflow-hidden">
                <img src={sub.photo_url} alt="Photo" className="w-full h-48 object-cover bg-gray-200" />
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs text-gray-600">Uploaded by: <span className="font-semibold text-green-700">{sub.uploader_name || 'Member'}</span></div>
                      <div className="text-xs text-gray-500 mt-1">Object: {sub.objects?.name}</div>
                    </div>
                    
                    <div className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                      sub.status === 'approved' ? 'bg-green-100 text-green-700' :
                      sub.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sub.status === 'rejected' ? 'Rejected' : sub.status}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mb-4 space-y-1">
                    <div><span className="font-semibold text-gray-500">Characteristics:</span> {sub.characteristics}</div>
                    <div><span className="font-semibold text-gray-500">Fun fact:</span> {sub.fun_fact}</div>
                  </div>

                  {sub.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(sub.id, 'rejected', 0)} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-xs font-bold active:scale-95">
                        Reject
                      </button>
                      <button onClick={() => handleReview(sub.id, 'partial', 5)} className="flex-1 bg-yellow-500 text-white rounded-lg py-2 text-xs font-bold active:scale-95">
                        Partial (+5)
                      </button>
                      <button onClick={() => handleReview(sub.id, 'approved', sub.objects.points)} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-xs font-bold active:scale-95">
                        Approve
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-xs font-bold text-gray-500">
                      Score Given: {sub.points_awarded} Points
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}