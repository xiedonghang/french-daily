import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ youtubeId: string }> }
) {
  const { youtubeId } = await params;
  const video = await prisma.video.findUnique({
    where: { youtubeId },
    select: { transcript: true },
  });

  if (!video?.transcript) {
    return NextResponse.json({ captions: [] });
  }

  try {
    return NextResponse.json({ captions: JSON.parse(video.transcript) });
  } catch {
    return NextResponse.json({ captions: [] });
  }
}
