"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { supabase } from "../../../lib/supabase";

export default function PesertaQuiz() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "play" | "result">("intro");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const nickname = localStorage.getItem("nickname");
      const teamCode = localStorage.getItem("team_code");
      
      if (!nickname || !teamCode) return router.push("/login");

      const { data: teamData } = await supabase.from("teams").select("id").eq("code", teamCode).single();
      
      if (!teamData) {
        alert("Team not found.");
        return router.push("/peserta/home");
      }

      const { data: memberData } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamData?.id) 
        .eq("nickname", nickname)
        .maybeSingle();
      
      if (!memberData) {
        alert("Member data not found. Please refresh the page.");
        return router.push("/peserta/home");
      }

      const { data: quizData } = await supabase
        .from("quiz_submissions")
        .select("id")
        .eq("member_id", memberData?.id)
        .maybeSingle();
        
      if (quizData) setIsDone(true);

      const { data: qData } = await supabase.from("quiz_questions").select("*");
      if (qData) {
        const shuffled = [...qData].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      }

      setLoading(false);
    };
    init();
  }, [router]);

  const startQuiz = () => {
    if (isDone) return alert("You have already completed this quiz!");
    if (questions.length === 0) return alert("The committee hasn't created any questions yet.");
    setStep("play");
  };

  const handleAnswer = async (selectedIdx: number) => {
    const q = questions[currentIdx];
    let newScore = score;
    
    if (selectedIdx === q.correct_index) {
      newScore += 8; 
      setScore(newScore);
    }

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      const nickname = localStorage.getItem("nickname");
      const teamCode = localStorage.getItem("team_code");
      
      const { data: teamData } = await supabase.from("teams").select("id, score").eq("code", teamCode).single();
      
      if (teamData) {
        const { data: memberData } = await supabase
          .from("team_members")
          .select("id")
          .eq("team_id", teamData.id) 
          .eq("nickname", nickname)
          .maybeSingle();
          
        if (memberData) {
          await supabase.from("quiz_submissions").insert([{ 
            team_id: teamData.id, 
            member_id: memberData.id, 
            score: newScore 
          }]);
          
          await supabase.from("teams").update({ score: teamData.score + newScore }).eq("id", teamData.id);
        }
      }

      setStep("result");
      setIsDone(true);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 p-4 overflow-y-auto fade-in bg-gray-50 flex flex-col">
        
        {loading ? (
          <div className="text-center mt-10">Loading questions...</div>
        ) : step === "intro" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-orange-800 mb-2">Kebun Raya Quiz</h2>
            <p className="text-sm text-gray-500 mb-8">Answer correctly. The score will be added to your team's total.</p>
            
            <div className="bg-white rounded-xl shadow p-4 mb-8 w-full">
              <div className="flex justify-between mb-2 border-b pb-2">
                <span className="text-gray-500 text-sm">Total Questions</span>
                <span className="font-bold">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Points per Question</span>
                <span className="font-bold">8 Points</span>
              </div>
            </div>

            <button 
              onClick={startQuiz} disabled={isDone || questions.length === 0}
              className={`w-full rounded-xl p-4 font-bold text-lg shadow-lg transition ${
                isDone || questions.length === 0 ? 'bg-gray-400 text-white' : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
              }`}
            >
              {isDone ? "ALREADY COMPLETED" : questions.length === 0 ? "NO QUESTIONS YET" : "START QUIZ"}
            </button>
            <button onClick={() => router.push('/peserta/home')} className="w-full mt-3 bg-gray-200 text-gray-700 rounded-xl p-3 font-semibold active:scale-95">Back</button>
          </div>
        ) : step === "play" ? (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4 text-sm font-bold">
              <span>Question {currentIdx + 1} / {questions.length}</span>
              <span className="text-orange-600">+8 Points</span>
            </div>
            
            <div className="bg-white rounded-2xl shadow p-5 mb-6 min-h-[140px] flex items-center">
              <h3 className="text-lg font-bold text-gray-800 leading-snug">{questions[currentIdx].question}</h3>
            </div>

            <div className="space-y-3">
              {[questions[currentIdx].option_a, questions[currentIdx].option_b, questions[currentIdx].option_c, questions[currentIdx].option_d].map((opt, idx) => (
                <button 
                  key={idx} onClick={() => handleAnswer(idx)}
                  className="w-full text-left border-2 border-gray-200 rounded-xl p-4 font-semibold text-gray-700 hover:border-orange-400 hover:bg-orange-50 transition active:scale-95"
                >
                  <span className="text-orange-500 mr-2">{['A','B','C','D'][idx]}.</span> {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Quiz Completed!</h2>
            
            <div className="bg-white rounded-2xl shadow p-6 mb-6 w-full">
              <div className="text-sm text-gray-500 mb-1">Your Score</div>
              <div className="text-5xl font-bold text-orange-500 mb-2">{score}</div>
              <div className="text-sm text-gray-600">out of {questions.length * 8} max points</div>
            </div>

            <div className="bg-orange-50 text-orange-800 p-3 rounded-xl text-sm mb-6 w-full font-semibold">
              ✅ This score has been added to your team's total points!
            </div>

            <button onClick={() => router.push('/peserta/home')} className="w-full bg-green-600 text-white rounded-xl p-4 font-bold active:scale-95">Back to Home</button>
          </div>
        )}

      </main>
    </>
  );
}