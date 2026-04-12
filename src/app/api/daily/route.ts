import { NextResponse } from "next/server";
import { fetchDailyVideo } from "@/lib/daily-fetch";

// POST /api/daily — trigger daily video fetch (called by cron)
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const video = await fetchDailyVideo();
    return NextResponse.json({ ok: true, videoId: video.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
