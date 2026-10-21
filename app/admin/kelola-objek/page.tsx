"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { supabase } from "../../../lib/supabase";

export default function AdminKelolaObjek() {
  const router = useRouter();
  const [objects, setObjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState("");
  const [newZone, setNewZone] = useState("");
  const [newPoints, setNewPoints] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    const { data } = await supabase.from("objects").select("*").order("created_at", { ascending: false });
    if (data) setObjects(data);
    setLoading(false);
  };

  const handleAddObject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return alert("Object name is required!");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("objects").insert([{
        name: newName,
        zone: newZone || "-",
        points: newPoints,
        created_by: "admin"
      }]);

      if (error) throw error;

      alert("✅ Task added successfully!");
      setNewName("");
      setNewZone("");
      setNewPoints(20);
      fetchObjects();
    } catch (error: any) {
      alert("❌ Failed to add: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    await supabase.from("objects").delete().eq("id", id);
    fetchObjects();
  };

  return (
    <>
      <Header />
      <main className="flex-1 p-4 overflow-y-auto fade-in bg-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.push('/admin/dashboard')} className="text-green-700 text-2xl">←</button>
          <h2 className="text-xl font-bold text-green-800">Assign Tasks (Objects)</h2>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-4 border-t-4 border-green-500">
          <h3 className="font-bold text-sm text-gray-800 mb-3">+ Add New Task</h3>
          <form onSubmit={handleAddObject} className="space-y-2">
            <input 
              type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm text-black" placeholder="Object name (e.g. Big Cactus)" required 
            />
            <div className="flex gap-2">
              <input 
                type="text" value={newZone} onChange={(e) => setNewZone(e.target.value)}
                className="flex-1 border rounded-lg p-2 text-sm text-black" placeholder="Location (Zone A)" 
              />
              <input 
                type="number" value={newPoints} onChange={(e) => setNewPoints(Number(e.target.value))}
                className="w-20 border rounded-lg p-2 text-sm text-center text-black" placeholder="Points" required 
              />
            </div>
            <button 
              type="submit" disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg p-2 text-xs font-bold transition active:scale-95 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? "Saving..." : "+ Add Task"}
            </button>
          </form>
        </div>

        <h3 className="font-bold text-sm text-gray-700 mb-2">Active Tasks</h3>
        {loading ? (
          <div className="text-center text-gray-500 py-4">Loading...</div>
        ) : (
          <div className="space-y-2">
            {objects.length === 0 ? (
               <div className="text-center text-sm text-gray-400 py-4 bg-white rounded-lg">No tasks assigned yet.</div>
            ) : objects.map((obj) => (
              <div key={obj.id} className="bg-white rounded-lg shadow p-3 flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm text-gray-800">{obj.name}</div>
                  <div className="text-xs text-gray-500">{obj.zone} · {obj.points} Points</div>
                </div>
                <button onClick={() => handleDelete(obj.id)} className="text-red-500 font-bold text-xl px-2">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}