import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ youtubeId: string }> }
) {
  const { youtubeId } = await params;

  try {
    const items = await YoutubeTranscript.fetchTranscript(youtubeId, {
      lang: "fr",
    });

    const captions = items.map((item) => ({
      start: item.offset / 1000,
      dur: item.duration / 1000,
      text: item.text,
    }));

    return NextResponse.json(
      { captions },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  } catch (e: any) {
    console.error("Caption fetch error:", e.message);
    return NextResponse.json({ captions: [], error: e.message });
  }
}
