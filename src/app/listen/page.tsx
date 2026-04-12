import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDuration, relativeDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ListenPage() {
  const videos = await prisma.video.findMany({
    orderBy: { fetchDate: "desc" },
    select: {
      id: true, youtubeId: true, title: true, channel: true,
      duration: true, thumbnail: true, fetchDate: true,
      _count: { select: { questions: true } },
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">听力库</h1>
        <p className="text-slate-500 text-sm">共 {videos.length} 篇听力练习</p>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-400">暂无听力内容</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((v, i) => {
            const isToday = new Date(v.fetchDate).toDateString() === new Date().toDateString();
            return (
              <Link key={v.id} href={`/listen/${v.id}`} className="group">
                <div className="bg-white rounded-xl overflow-hidden border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all h-full flex flex-col">
                  <div className="relative">
                    <img src={v.thumbnail} alt="" className="w-full aspect-video object-cover" />
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-mono px-1.5 py-0.5 rounded">
                      {formatDuration(v.duration)}
                    </span>
                    {isToday && (
                      <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow">
                        <span className="text-indigo-600 text-lg ml-0.5">▶</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors mb-auto">
                      {v.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                      <span className="truncate">{v.channel}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{v._count.questions} 题</span>
                        <span>{relativeDate(new Date(v.fetchDate))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
