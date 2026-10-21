"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { supabase } from "../../../lib/supabase";

export default function PesertaHunting() {
  const router = useRouter();
  const [objects, setObjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const teamCode = localStorage.getItem("team_code");
    if (!teamCode) {
      router.push("/login");
      return;
    }
    
    // Paksa ambil data baru setiap kali halaman dibuka
    const fetchObjects = async () => {
      try {
        // 1. Ambil ID Tim dari kode tim
        const { data: teamData } = await supabase
          .from("teams")
          .select("id")
          .eq("code", teamCode)
          .single();

        if (!teamData) return;

        // 2. Ambil SEMUA objek & SEMUA submission
        const { data: allObjects } = await supabase.from("objects").select("*").order("created_at", { ascending: true });
        const { data: allSubmissions } = await supabase.from("submissions").select("object_id, uploader_name, team_id");

        if (allObjects) {
          // 3. Saring (Filter) MANUAL pake Javascript di sini
          const filteredObjects = allObjects
            .filter((obj) => {
              // Syarat objek muncul: Dibuat admin ATAU dibuat sama tim ini (string compare)
              return obj.created_by === 'admin' || obj.created_by === teamCode;
            })
            .map((obj) => {
              // Cari foto yang sesuai dengan objek ini DAN milik tim ini
              const mySubmission = allSubmissions?.find(
                (sub) => sub.object_id === obj.id && sub.team_id === teamData.id
              );

              return {
                ...obj,
                // Kalau ketemu, ambil namanya. Kalau nggak, null.
                uploader_name: mySubmission ? mySubmission.uploader_name : null
              };
            });

          setObjects(filteredObjects);
        }
      } catch (error) {
        console.error("Error fetching objects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();
  }, [router]);

  return (
    <>
      <Header />
      <main className="flex-1 p-4 overflow-y-auto fade-in bg-gray-50">
        <h2 className="text-xl font-bold text-green-800 mb-3">Daftar Objek ({localStorage.getItem("team_code")})</h2>

        <button 
          onClick={() => router.push('/peserta/upload')}
          className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl p-3 mb-4 font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition active:scale-95"
        >
          <span className="text-xl">+</span> TAMBAH OBJEK BARU
        </button>

        {loading ? (
          <div className="text-center text-gray-500 mt-10">Memuat objek...</div>
        ) : objects.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow text-gray-500">
            Belum ada objek hunting. Tunggu panitia atau tambah sendiri!
          </div>
        ) : (
          <div className="space-y-3">
            {objects.map((obj) => (
              <div 
                key={obj.id} 
                onClick={() => router.push(`/peserta/upload?objId=${obj.id}`)}
                className="bg-white rounded-xl shadow p-4 flex items-center gap-3 cursor-pointer hover:shadow-lg active:scale-95 transition"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                  📷
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate text-gray-800 flex items-center gap-2">
                    {obj.name}
                    {obj.created_by !== 'admin' && (
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Pribadi</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{obj.zone || '-'} · {obj.points} poin</div>
                </div>

                {/* LABEL PENGUNGGAH TIM SENDIRI */}
                <div className={`flex-shrink-0 px-2 py-1 rounded-lg text-center min-w-[70px] ${obj.uploader_name ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="text-[8px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Oleh</div>
                  <div className={`text-[10px] font-bold ${obj.uploader_name ? 'text-green-700' : 'text-gray-400'}`}>
                    {obj.uploader_name || 'Belum ada'}
                  </div>
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
