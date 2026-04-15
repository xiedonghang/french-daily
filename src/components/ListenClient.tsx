"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Question {
  id: string; questionText: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  correctAnswer: string; explanation: string; orderIndex: number;
}

interface Caption {
  start: number;
  dur: number;
  text: string;
}

const OPTS = ["A", "B", "C", "D"] as const;
const OKEY = { A: "optionA", B: "optionB", C: "optionC", D: "optionD" } as const;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ListenClient({
  videoId, questions,
}: {
  videoId: string; questions: Question[];
}) {
  const playerRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const captionListRef = useRef<HTMLDivElement>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [captionLoading, setCaptionLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);

  // Quiz state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const answered = Object.keys(answers).length;
  const score = submitted ? questions.filter((q) => answers[q.id] === q.correctAnswer).length : 0;

  // Load YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      document.head.appendChild(tag);
    }

    const init = () => {
      playerRef.current = new (window as any).YT.Player("yt-player", {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, cc_load_policy: 1, cc_lang_pref: "fr" },
        events: {
          onReady: () => setPlayerReady(true),
        },
      });
    };

    if ((window as any).YT?.Player) {
      init();
    } else {
      (window as any).onYouTubeIframeAPIReady = init;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      playerRef.current?.destroy?.();
    };
  }, [videoId]);

  // Poll current time
  useEffect(() => {
    if (!playerReady) return;
    timerRef.current = setInterval(() => {
      const t = playerRef.current?.getCurrentTime?.();
      if (typeof t === "number") setCurrentTime(t);
    }, 300);
    return () => clearInterval(timerRef.current);
  }, [playerReady]);

  // Fetch captions: API returns track URL, browser fetches the actual XML
  useEffect(() => {
    setCaptionLoading(true);
    fetch(`/api/captions/${videoId}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.trackUrl) { setCaptions([]); return; }
        const xml = await fetch(d.trackUrl).then((r) => r.text());
        const parsed: Caption[] = [];
        const re = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
        let m;
        while ((m = re.exec(xml)) !== null) {
          parsed.push({
            start: parseFloat(m[1]),
            dur: parseFloat(m[2]),
            text: m[3].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/<[^>]+>/g, "").trim(),
          });
        }
        // Fallback: try <p t="" d=""> format
        if (parsed.length === 0) {
          const re2 = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
          while ((m = re2.exec(xml)) !== null) {
            const text = m[3].replace(/<s[^>]*>([^<]*)<\/s>/g, "$1").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
            if (text) parsed.push({ start: parseInt(m[1]) / 1000, dur: parseInt(m[2]) / 1000, text });
          }
        }
        setCaptions(parsed);
      })
      .catch(() => setCaptions([]))
      .finally(() => setCaptionLoading(false));
  }, [videoId]);

  // Auto-scroll to active caption
  const activeIdx = captions.findIndex(
    (c) => currentTime >= c.start && currentTime < c.start + c.dur
  );

  useEffect(() => {
    if (activeIdx < 0 || !captionListRef.current) return;
    const el = captionListRef.current.children[activeIdx] as HTMLElement;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIdx]);

  const seekTo = useCallback((time: number) => {
    playerRef.current?.seekTo?.(time, true);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
      {/* Left: Video + Captions — sticky, fits viewport */}
      <div className="lg:col-span-3 lg:sticky lg:top-[3.75rem] lg:h-[calc(92vh-4.5rem)] flex flex-col overflow-hidden">
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-900 shrink-0">
          <div id="yt-player" className="w-full h-full" />
        </div>

        {/* Captions panel */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200/80 overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">📜</span>
              <span className="text-sm font-semibold text-slate-700">法语字幕</span>
            </div>
            <span className="text-xs text-slate-400">
              {captionLoading ? "加载中..." : captions.length > 0 ? `${captions.length} 句` : "无字幕"}
            </span>
          </div>
          <div ref={captionListRef} className="overflow-y-auto divide-y divide-slate-50 flex-1 min-h-0">
            {captions.map((c, i) => (
              <button
                key={i}
                onClick={() => seekTo(c.start)}
                className={`w-full text-left px-5 py-2.5 flex items-start gap-3 transition-colors hover:bg-indigo-50/60 ${i === activeIdx ? "bg-indigo-50 border-l-2 border-indigo-500" : "border-l-2 border-transparent"
                  }`}
              >
                <span className={`text-xs font-mono shrink-0 mt-0.5 ${i === activeIdx ? "text-indigo-600 font-semibold" : "text-slate-400"
                  }`}>
                  {formatTime(c.start)}
                </span>
                <span className={`text-sm leading-relaxed ${i === activeIdx ? "text-indigo-900 font-medium" : "text-slate-600"
                  }`}>
                  {c.text}
                </span>
              </button>
            ))}
            {!captionLoading && captions.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                该视频暂无可用的法语字幕
              </div>
            )}
          </div>
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
                className={`h-full rounded-full transition-all duration-500 ${submitted ? (score >= 4 ? "bg-emerald-500" : score >= 2 ? "bg-amber-500" : "bg-red-400") : "bg-indigo-500"
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
                    <div className={`ml-7 mt-2.5 text-xs leading-relaxed px-3 py-2 rounded-lg ${isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
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
