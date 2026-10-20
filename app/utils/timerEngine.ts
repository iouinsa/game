import { supabase } from "../../lib/supabase";

let engineInterval: NodeJS.Timeout | null = null;

export const startTimerEngine = () => {
  // Kalau mesin udah jalan, jangan jalanin 2 kali
  if (engineInterval) return;

  engineInterval = setInterval(async () => {
    try {
      const { data: session } = await supabase
        .from("session_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (session && session.is_running && !session.is_paused && !session.is_finished) {
        if (session.remaining_seconds > 0) {
          await supabase
            .from("session_settings")
            .update({ remaining_seconds: session.remaining_seconds - 1 })
            .eq("id", 1);
        } else {
          await supabase
            .from("session_settings")
            .update({ is_running: false, is_finished: true })
            .eq("id", 1);
        }
      }
    } catch (err) {
      console.error("Timer engine error:", err);
    }
  }, 1000);
};