"use client";

import { useEffect } from "react";
import { startTimerEngine } from "../utils/timerEngine";

export default function TimerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Nyalakan mesin timer saat aplikasi pertama kali dibuka
    startTimerEngine();
  }, []);

  return <>{children}</>;
}