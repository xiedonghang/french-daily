"use client";

import { useState } from "react";

interface Question {
  id: string; questionText: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  correctAnswer: string; explanation: string; orderIndex: number;
}

const OPTS = ["A", "B", "C", "D"] as const;
const OKEY = { A: "optionA", B: "optionB", C: "optionC", D: "optionD" } as const;

export default function ListenClient({
  videoId, questions,
}: {
  videoId: string; questions: Question[];
}) {
  // === Quiz ===
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const answered = Object.keys(answers).length;
  const score = submitted ? questions.filter((q) => answers[q.id] === q.correctAnswer).length : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
      {/* Left: Video */}
      <div className="lg:col-span-3">
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-900">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&cc_load_policy=1&cc_lang_pref=fr`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="mt-4 bg-white rounded-xl border border-slate-200/80 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💡</span>
            <span className="text-sm font-semibold text-slate-700">字幕提示</span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            视频播放器已自动加载法语字幕。如未显示，请点击播放器右下角的 <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">CC</span> 按钮开启字幕，并选择「法语」。
          </p>
        </div>
      </div>

      {/* Right: Quiz */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-slate-800">📝 听力测试</h2>
              {submitted ? (
                <span className={`text-sm font-bold ${score >= 4 ? "text-emerald-600" : score >= 2 ? "text-amber-600" : "text-red-500"}`}>
                  {score}/{questions.length} 分
                </span>
              ) : (
                <span className="text-xs text-slate-400">{answered}/{questions.length} 已答</span>
              )}
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  submitted ? (score >= 4 ? "bg-emerald-500" : score >= 2 ? "bg-amber-500" : "bg-red-400") : "bg-indigo-500"
                }`}
                style={{ width: `${((submitted ? score : answered) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {questions.map((q, i) => {
              const picked = answers[q.id];
              const isCorrect = picked === q.correctAnswer;
              return (
                <div key={q.id} className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-800 mb-3 leading-relaxed">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full mr-2">{i + 1}</span>
                    {q.questionText}
                  </p>
                  <div className="space-y-1.5 ml-7">
                    {OPTS.map((opt) => {
                      const text = q[OKEY[opt]];
                      const sel = picked === opt;
                      const cor = q.correctAnswer === opt;
                      let cls = "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50";
                      if (submitted) {
                        if (cor) cls = "border-emerald-400 bg-emerald-50";
                        else if (sel && !isCorrect) cls = "border-red-300 bg-red-50";
                        else cls = "border-slate-100 opacity-60";
                      } else if (sel) {
                        cls = "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500/20";
                      }
                      return (
                        <div
                          key={opt}
                          onClick={() => { if (!submitted) setAnswers((p) => ({ ...p, [q.id]: opt })); }}
                          className={`px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${cls}`}
                        >
                          <span className="font-semibold mr-1.5">{opt}.</span>{text}
                        </div>
                      );
                    })}
                  </div>
                  {submitted && (
                    <div className={`ml-7 mt-2.5 text-xs leading-relaxed px-3 py-2 rounded-lg ${
                      isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    }`}>
                      {isCorrect ? "✅ " : `❌ 正确答案 ${q.correctAnswer} · `}{q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
            {!submitted ? (
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                disabled={answered < questions.length}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                提交答案
              </button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">
                  {score === 5 ? "🎉 满分！太棒了！" : score >= 3 ? "👍 不错，继续加油！" : "💪 多听几遍再试试！"}
                </p>
                <button type="button" onClick={() => { setAnswers({}); setSubmitted(false); }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                  重新答题 →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
