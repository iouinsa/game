import { supabase } from "./supabase";

export const startTimerEngine = () => {
  setInterval(async () => {
    const { data: session, error: errRead } = await supabase
      .from("session_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (errRead) {
      console.log("❌ Gagal baca timer:", errRead.message);
      return;
    }

    if (session && session.is_running && !session.is_paused && !session.is_finished) {
      if (session.remaining_seconds > 0) {
        const { error: errUpdate } = await supabase
          .from("session_settings")
          .update({ remaining_seconds: session.remaining_seconds - 1 })
          .eq("id", 1);
          
        if (errUpdate) {
          console.log("❌ Gagal update timer:", errUpdate.message);
        } else {
          console.log("⏱ Timer jalan:", session.remaining_seconds - 1);
        }
      } else {
        await supabase
          .from("session_settings")
          .update({ is_running: false, is_finished: true })
          .eq("id", 1);
      }
    }
  }, 1000);
};