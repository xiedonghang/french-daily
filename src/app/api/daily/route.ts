import { NextResponse } from "next/server";
import { fetchDailyVideo } from "@/lib/daily-fetch";

// Vercel cron sends GET requests
export const maxDuration = 300; // 5 minutes (max for Pro plan)

export async function GET(req: Request) {
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
