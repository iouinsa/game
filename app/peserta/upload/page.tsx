"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import { supabase } from "../../../lib/supabase";

function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const objId = searchParams.get("objId");
  
  const [objectData, setObjectData] = useState<any>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  
  const [newObjName, setNewObjName] = useState("");
  const [newObjZone, setNewObjZone] = useState("");
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [characteristics, setCharacteristics] = useState("");
  const [funFact, setFunFact] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // RESET FORM SETIAP KALI BUKA HALAMAN
    setPreview("");
    setFile(null);
    setCharacteristics("");
    setFunFact("");
    setNewObjName("");
    setNewObjZone("");
    
    if (!objId) {
      setObjectData(null);
      setExistingPhoto(null);
      return;
    }
    
    const fetchObj = async () => {
      const { data } = await supabase.from("objects").select("*").eq("id", objId).single();
      setObjectData(data);

      const teamCode = localStorage.getItem("team_code");
      if (teamCode) {
        const { data: teamData } = await supabase.from("teams").select("id").eq("code", teamCode).single();
        if (teamData) {
          const { data: existingSub } = await supabase
            .from("submissions")
            .select("photo_url")
            .eq("object_id", objId)
            .eq("team_id", teamData.id)
            .maybeSingle();
            
          if (existingSub) setExistingPhoto(existingSub.photo_url);
        }
      }
    };
    fetchObj();
  }, [objId]);

  // FUNGSI UNTUK KOMPRES FOTO
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setPreview(URL.createObjectURL(selected));

    const reader = new FileReader();
    reader.readAsDataURL(selected);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; 
        const scaleSize = MAX_WIDTH / img.width;
        
        if (scaleSize >= 1) {
          setFile(selected);
          return;
        }

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], selected.name, { type: "image/jpeg" });
            setFile(newFile);
          }
        }, "image/jpeg", 0.7); 
      };
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Foto wajib diambil!");
    if (!characteristics || !funFact) return alert("Ciri dan Fun fact wajib diisi!");
    if (!objId && !newObjName) return alert("Nama objek baru wajib diisi!");

    setIsUploading(true);
    try {
      let currentObjId = objId;

      if (!objId) {
        const teamCode = localStorage.getItem("team_code");
        const { data: newObj, error: objError } = await supabase
          .from("objects")
          .insert([{ 
            name: newObjName, 
            zone: newObjZone || 'Lokasi tidak disebutkan', 
            points: 15, 
            created_by: teamCode 
          }])
          .select().single();
        
        if (objError) throw objError;
        currentObjId = newObj.id;
      }

      const fileExt = 'jpg';
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("photos").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(fileName);

      const teamCode = localStorage.getItem("team_code");
      const nickname = localStorage.getItem("nickname") || "Anggota";

      const { data: teamData, error: teamError } = await supabase
        .from("teams").select("id").eq("code", teamCode).single();
      if (teamError || !teamData) throw new Error("Tim tidak ditemukan.");

      const { data: memberData } = await supabase
        .from("team_members").select("id").eq("team_id", teamData.id).eq("nickname", nickname).maybeSingle();

      const { error: dbError } = await supabase.from("submissions").insert([{
        team_id: teamData.id,
        member_id: memberData?.id || null,
        uploader_name: nickname,
        object_id: currentObjId,
        photo_url: publicUrl,
        characteristics: characteristics,
        fun_fact: funFact,
        status: "pending",
        points_awarded: 0
      }]);

      if (dbError) throw dbError;

      alert("✅ Berhasil dikirim ke panitia!");
      router.push("/peserta/home");

    } catch (error: any) {
      alert("❌ Gagal: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="flex-1 p-4 overflow-y-auto fade-in bg-gray-50">
      <button onClick={() => router.push('/peserta/hunting')} className="text-gray-500 font-semibold mb-4 text-sm flex items-center gap-1">
        ← Kembali ke Hunting
      </button>

      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-bold text-gray-800 mb-1">Upload Foto</h2>
        <p className="text-sm text-green-700 font-semibold mb-4">
          {objId ? objectData?.name : "Tambah Objek Baru"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!objId && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2 border border-blue-200">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Objek Baru</label>
                <input type="text" value={newObjName} onChange={(e) => setNewObjName(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black" placeholder="misal: Bunga Kecil di Tembok" required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Lokasi / Zona</label>
                <input type="text" value={newObjZone} onChange={(e) => setNewObjZone(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black" placeholder="misal: Dekat kolam ikan" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-2">Foto Selfie</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden bg-gray-50">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : existingPhoto ? (
                <div className="w-full h-full relative">
                  <img src={existingPhoto} alt="Foto Objek" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold">Foto sudah di-upload</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-5xl mb-2">📷</div>
                  <div className="text-sm font-semibold">Ambil Foto / Upload</div>
                </>
              )}
              
              {!existingPhoto && (
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              )}
            </div>
            {existingPhoto && (
              <p className="text-[10px] text-red-500 mt-1">Objek ini sudah di-upload oleh tim Anda. Tidak bisa upload ulang.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Ciri-ciri yang terlihat</label>
            <textarea value={characteristics} onChange={(e) => setCharacteristics(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black" rows={2} placeholder="Tinggi, warna, bentuk..." required />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Fun fact</label>
            <textarea value={funFact} onChange={(e) => setFunFact(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-black" rows={2} placeholder="Fakta menarik..." required />
          </div>

          <button 
            type="submit" 
            disabled={isUploading || !!existingPhoto} 
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl p-3 font-semibold transition active:scale-95 disabled:opacity-50 mt-4"
          >
            {isUploading ? "Mengirim..." : existingPhoto ? "Sudah Di-upload" : "Kirim ke Panitia"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function PesertaUpload() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="p-8">Loading...</div>}>
        <UploadForm />
      </Suspense>
    </>
  );
}
