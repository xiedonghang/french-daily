import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/videos?page=1 — list videos with pagination
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = 12;

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      orderBy: { fetchDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        youtubeId: true,
        title: true,
        channel: true,
        duration: true,
        thumbnail: true,
        fetchDate: true,
      },
    }),
    prisma.video.count(),
  ]);

  return NextResponse.json({ videos, total, page, pageSize });
}
