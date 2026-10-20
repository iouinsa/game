"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { supabase } from "../../../lib/supabase";

export default function AdminQuiz() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State form
  const [text, setText] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [d, setD] = useState("");
  const [correct, setCorrect] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

    const fetchQuestions = async () => {
    setLoading(true);
    // Ambil semua data tanpa mikirin urutan
    const { data, error } = await supabase.from("quiz_questions").select("*");
      
    if (error) {
      console.error("Gagal ambil soal:", error.message);
      alert("Error ambil data: " + error.message);
    } else if (data) {
      console.log("Data soal dari DB:", data); // Cek di console browser
      setQuestions(data);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !a || !b || !c || !d) return alert("Isi semua kolom!");
    
    setIsSubmitting(true);
        const { error } = await supabase.from("quiz_questions").insert([{
      question: text, 
      option_a: a, 
      option_b: b, 
      option_c: c, 
      option_d: d, 
      correct_index: correct,
      points: 10 // <--- Pastikan ini ada
    }]);

    if (error) {
      alert("❌ Gagal menyimpan: " + error.message);
    } else {
      alert("✅ Soal berhasil ditambahkan!");
      // Kosongkan form
      setText(""); setA(""); setB(""); setC(""); setD(""); setCorrect(0);
      // Ambil data terbaru
      fetchQuestions();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus soal ini?")) return;
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    if (error) alert("Gagal hapus: " + error.message);
    fetchQuestions();
  };

  return (
    <>
      <Header />
      <main className="flex-1 p-4 overflow-y-auto fade-in bg-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.push('/admin/dashboard')} className="text-green-700 text-2xl">←</button>
          <h2 className="text-xl font-bold text-green-800">Editor Soal Quiz</h2>
        </div>

        {/* FORM TAMBAH SOAL */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 border-t-4 border-orange-500">
          <h3 className="font-bold text-sm text-orange-600 mb-3">+ Tambah Soal Baru</h3>
          <form onSubmit={handleAdd} className="space-y-2">
            <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Pertanyaan..." className="w-full border rounded-lg p-2 text-sm text-black" required />
            <input type="text" value={a} onChange={e => setA(e.target.value)} placeholder="Pilihan A" className="w-full border rounded-lg p-2 text-sm text-black" required />
            <input type="text" value={b} onChange={e => setB(e.target.value)} placeholder="Pilihan B" className="w-full border rounded-lg p-2 text-sm text-black" required />
            <input type="text" value={c} onChange={e => setC(e.target.value)} placeholder="Pilihan C" className="w-full border rounded-lg p-2 text-sm text-black" required />
            <input type="text" value={d} onChange={e => setD(e.target.value)} placeholder="Pilihan D" className="w-full border rounded-lg p-2 text-sm text-black" required />
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold">Jawaban Benar:</span>
              <select value={correct} onChange={e => setCorrect(Number(e.target.value))} className="border rounded-lg p-1 text-sm flex-1 text-black">
                <option value={0}>A</option>
                <option value={1}>B</option>
                <option value={2}>C</option>
                <option value={3}>D</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg p-2 text-xs font-bold mt-2 transition"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Soal"}
            </button>
          </form>
        </div>

        {/* DAFTAR SOAL */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-sm text-gray-700">Daftar Soal ({questions.length})</h3>
          <button onClick={fetchQuestions} className="text-xs text-blue-500 font-semibold">🔄 Refresh</button>
        </div>
        
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-4">Memuat soal...</div>
        ) : questions.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-4 bg-white rounded-lg">Belum ada soal quiz.</div>
        ) : (
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={q.id} className="bg-white rounded-lg shadow p-3 border-l-4 border-orange-500">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-sm">Soal {i+1}</div>
                  <button onClick={() => handleDelete(q.id)} className="text-red-500 text-xs font-semibold px-2">Hapus</button>
                </div>
                <div className="text-sm text-gray-800 mb-2">{q.question}</div>
                <div className="text-xs text-green-700 bg-green-50 p-1 rounded">Jawaban: {['A','B','C','D'][q.correct_index]}</div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}