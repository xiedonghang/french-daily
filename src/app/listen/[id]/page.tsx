import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDuration } from "@/lib/format";
import ListenClient from "@/components/ListenClient";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await prisma.video.findUnique({
    where: { id },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!video) notFound();

  let segments: { text: string; offset: number; duration: number }[] = [];
  try {
    segments = JSON.parse(video.transcript);
  } catch {
    segments = [{ text: video.transcript, offset: 0, duration: 0 }];
  }

  const questions = video.questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    orderIndex: q.orderIndex,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-indigo-600 transition-colors">首页</Link>
        <span>/</span>
        <Link href="/listen" className="hover:text-indigo-600 transition-colors">听力库</Link>
        <span>/</span>
        <span className="text-slate-600 truncate max-w-[200px]">{video.title}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 leading-snug">
          {video.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {video.channel}
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDuration(video.duration)}
          </span>
          <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {video.questions.length} 道测试题
          </span>
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            B1-B2
          </span>
        </div>
      </div>

      <ListenClient videoId={video.youtubeId} segments={segments} questions={questions} />
    </div>
  );
}
