import { supabase } from "./supabase";

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const getSession = async () => {
  const { data, error } = await supabase
    .from("session_settings")
    .select("*")
    .eq("id", 1)
    .single();

  // Kalau datanya ga ada (misal kehapus), kita bikinin otomatis
  if (error || !data) {
    console.log("Membuat data sesi baru...");
    const { data: newData } = await supabase
      .from("session_settings")
      .insert([{ id: 1, duration_minutes: 40, remaining_seconds: 2400, is_running: false }])
      .select()
      .single();
    return { data: newData, error: null };
  }

  return { data, error };
};

export const updateSession = async (updates: any) => {
  const { data, error } = await supabase
    .from("session_settings")
    .update(updates)
    .eq("id", 1);
  return { data, error };
};