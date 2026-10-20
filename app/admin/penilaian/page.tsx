"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { supabase } from "../../../lib/supabase";

export default function AdminPenilaian() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    // Ambil data submission, gabung sama nama tim dan nama objek
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        *,
        teams (name),
        objects (name, points)
      `)
      .order("created_at", { ascending: false });

    if (data) setSubmissions(data);
    if (error) console.error(error);
    setLoading(false);
  };

  const handleReview = async (id: string, teamId: string, status: string, pointsToAdd: number) => {
    // 1. Update status dan poin di tabel submissions
    const { error: subError } = await supabase
      .from("submissions")
      .update({ status: status, points_awarded: pointsToAdd })
      .eq("id", id);

    if (subError) return alert("Gagal update: " + subError.message);

    // 2. Tambah skor ke tabel teams (CUMA KALAU APPROVED/PARTIAL)
    if (status === "approved" || status === "partial") {
      // Ambil skor skrg
      const { data: team } = await supabase.from("teams").select("score").eq("id", teamId).single();
      
      if (team) {
        // Tambahkan poinnya (Cuma 1x)
        await supabase.from("teams").update({ score: team.score + pointsToAdd }).eq("id", teamId);
      }
    }

    alert(`✅ Penilaian disimpan! (+${pointsToAdd} Poin)`);
    fetchSubmissions(); // Refresh list
  };
  return (
    <>
      <Header />
      <main className="flex-1 p-4 overflow-y-auto fade-in bg-gray-50">
        <h2 className="text-xl font-bold text-green-800 mb-4">Penilaian Foto</h2>

        {loading ? (
          <div className="text-center text-gray-500 mt-10">Memuat data...</div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow text-gray-500">
            Belum ada foto yang di-upload.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-xl shadow overflow-hidden">
                {/* Foto */}
                <img src={sub.photo_url} alt="Foto" className="w-full h-48 object-cover bg-gray-200" />
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-gray-800">{sub.teams?.name}</div>
                      <div className="text-xs text-gray-500">Objek: {sub.objects?.name} ({sub.objects?.points} Poin)</div>
                    </div>
                    <div className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                      sub.status === 'approved' ? 'bg-green-100 text-green-700' :
                      sub.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sub.status}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mb-4 space-y-1">
                    <div><span className="font-semibold text-gray-500">Ciri:</span> {sub.characteristics}</div>
                    <div><span className="font-semibold text-gray-500">Fun fact:</span> {sub.fun_fact}</div>
                  </div>

                  {/* Tombol Aksi (Cuma muncul kalau statusnya pending) */}
                  {sub.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(sub.id, sub.team_id, 'rejected', 0)} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-xs font-bold active:scale-95">
                        Tolak
                      </button>
                      <button onClick={() => handleReview(sub.id, sub.team_id, 'partial', 10)} className="flex-1 bg-yellow-500 text-white rounded-lg py-2 text-xs font-bold active:scale-95">
                        Parsial (+10)
                      </button>
                      <button onClick={() => handleReview(sub.id, sub.team_id, 'approved', sub.objects.points)} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-xs font-bold active:scale-95">
                        Approve
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-xs font-bold text-gray-500">
                      Skor Diberikan: {sub.points_awarded} Poin
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