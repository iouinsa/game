"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "../../lib/supabase";

// Komponen isi Nav
function NavContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [showRank, setShowRank] = useState(false);

  const isAdmin = typeof window !== "undefined" && localStorage.getItem("is_admin") === "true";

  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase.from("session_settings").select("show_leaderboard").eq("id", 1).single();
      if (data) setShowRank(data.show_leaderboard);
    };
    fetchStatus();

    const channel = supabase.channel('nav_status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_settings' }, (payload) => {
        setShowRank(payload.new.show_leaderboard);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const pesertaNav = [
    { name: "Home", path: "/peserta/home", icon: "🏠" },
    { name: "Hunting", path: "/peserta/hunting", icon: "📸" },
    ...(showRank ? [{ name: "Rank", path: "/peserta/rank", icon: "🏆" }] : [])
  ];

  const adminNav = [
    { name: "Admin", path: "/admin/dashboard", icon: "🎛️" },
    { name: "Nilai", path: "/admin/penilaian", icon: "📝" },
    { name: "Rank", path: "/peserta/rank", icon: "🏆" }
  ];

  const navItems = isAdmin ? adminNav : pesertaNav;

  return (
    <nav className="bg-white border-t border-gray-200 flex shadow-[0_-2px_12px_rgba(0,0,0,0.06)] flex-shrink-0 z-40 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <button
            key={item.name}
            onClick={() => router.push(item.path)}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors relative ${
              isActive ? "text-green-600" : "text-gray-400"
            }`}
          >
            {isActive && (
              <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-green-600 rounded-b-md"></div>
            )}
            <span className={`text-2xl mb-0.5 transition-transform ${isActive ? "scale-110" : ""}`}>
              {item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
}

// Komponen Utama (Dibungkus Suspense)
export default function BottomNav() {
  return (
    <Suspense fallback={<div className="h-[60px] bg-white border-t border-gray-200"></div>}>
      <NavContent />
    </Suspense>
  );
}
