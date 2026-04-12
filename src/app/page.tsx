import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDuration, relativeDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayVideo = await prisma.video.findFirst({
    where: { fetchDate: { gte: today } },
    include: { questions: true },
  });

  const recentVideos = await prisma.video.findMany({
    orderBy: { fetchDate: "desc" },
    take: 6,
    select: {
      id: true, youtubeId: true, title: true, channel: true,
      duration: true, thumbnail: true, fetchDate: true,
      _count: { select: { questions: true } },
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-blue-200 text-sm font-medium tracking-wide uppercase mb-3">每日法语听力</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
            每天10分钟<br />轻松提升法语听力
          </h1>
          <p className="text-blue-100 max-w-lg mb-8">
            精选法语视频，AI 智能出题，逐句字幕同步。坚持每天一练，听力水平稳步提升。
          </p>
          {todayVideo ? (
            <Link
              href={`/listen/${todayVideo.id}`}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-6 py-3 rounded-full hover:bg-blue-50 transition-colors shadow-lg shadow-indigo-900/20"
            >
              <span className="text-lg">▶</span> 开始今日听力
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2 bg-white/20 text-white font-medium px-6 py-3 rounded-full">
              ⏳ 今日听力准备中...
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Today's Featured */}
        {todayVideo && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1 h-5 bg-indigo-500 rounded-full" />
              <h2 className="text-lg font-bold text-slate-800">今日推荐</h2>
            </div>
            <Link href={`/listen/${todayVideo.id}`} className="group block">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all">
                <div className="flex flex-col md:flex-row">
                  <div className="relative md:w-[480px] shrink-0">
                    <img src={todayVideo.thumbnail} alt="" className="w-full aspect-video object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-mono px-2 py-0.5 rounded">
                      {formatDuration(todayVideo.duration)}
                    </span>
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-indigo-600 text-2xl ml-1">▶</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        🎧 今日听力
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {todayVideo.questions.length} 道测试题
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {todayVideo.title}
                    </h3>
                    <p className="text-slate-500 text-sm">{todayVideo.channel}</p>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Recent */}
        {recentVideos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 bg-slate-300 rounded-full" />
                <h2 className="text-lg font-bold text-slate-800">往期听力</h2>
              </div>
              <Link href="/listen" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                查看全部 →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentVideos.map((v) => (
                <Link key={v.id} href={`/listen/${v.id}`} className="group">
                  <div className="bg-white rounded-xl overflow-hidden border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all">
                    <div className="relative">
                      <img src={v.thumbnail} alt="" className="w-full aspect-video object-cover" />
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-mono px-1.5 py-0.5 rounded">
                        {formatDuration(v.duration)}
                      </span>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow">
                          <span className="text-indigo-600 text-lg ml-0.5">▶</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2">
                        {v.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="truncate">{v.channel}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span>{v._count.questions} 题</span>
                          <span>·</span>
                          <span>{relativeDate(new Date(v.fetchDate))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {recentVideos.length === 0 && !todayVideo && (
          <section className="text-center py-20">
            <div className="text-5xl mb-4">🎧</div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">内容准备中</h2>
            <p className="text-slate-400">每天自动更新一篇法语听力，敬请期待</p>
          </section>
        )}
      </div>
    </div>
  );
}
