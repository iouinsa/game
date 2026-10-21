"use client";

import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";

export default function PesertaHunting() {
  const router = useRouter();

  return (
    <>
      <Header />
      <main className="flex-1 p-4 overflow-y-auto fade-in bg-gray-50 flex flex-col">
        
        <div className="flex-1 flex flex-col items-center justify-center">
          
          {/* TOMBOL RAKSASA FULL LAYAR */}
          <button 
            onClick={() => router.push('/peserta/upload')}
            className="w-full h-full min-h-[60vh] bg-green-600 hover:bg-green-700 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center gap-4 transition active:scale-95 p-8"
          >
            <div className="text-8xl mb-2">📸</div>
            <h1 className="text-3xl font-bold text-center leading-tight">
              ADD NEW<br />OBJECT
            </h1>
            <p className="text-sm text-green-100 text-center mt-4 opacity-80">
              Tap here to take a photo of the object and submit it to the committee.
            </p>
          </button>

        </div>

      </main>
      <BottomNav />
    </>
  );
}