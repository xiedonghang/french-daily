import { NextResponse } from "next/server";

// This endpoint extracts the French caption track URL from YouTube's page.
// The actual caption XML must be fetched by the client browser (YouTube blocks server IPs).
export async function GET(
  _: Request,
  { params }: { params: Promise<{ youtubeId: string }> }
) {
  const { youtubeId } = await params;

  try {
    const pageRes = await fetch(
      `https://www.youtube.com/watch?v=${youtubeId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept-Language": "fr-FR,fr;q=0.9",
          Cookie: "CONSENT=PENDING+987; SOCS=CAESEwgDEgk2MTcxMjcxMjQaAmVuIAEaBgiA_LyuBg",
        },
      }
    );
    const html = await pageRes.text();

    const match = html.match(/"captionTracks":(\[.*?\])/);
    if (!match) {
      return NextResponse.json({ trackUrl: null, error: "no_captions" });
    }

    const tracks = JSON.parse(match[1].replace(/\\u0026/g, "&"));
    const fr =
      tracks.find((t: any) => t.vssId === ".fr") ||
      tracks.find((t: any) => t.languageCode === "fr");

    if (!fr) {
      return NextResponse.json({ trackUrl: null, error: "no_french_track" });
    }

    return NextResponse.json(
      { trackUrl: fr.baseUrl },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (e: any) {
    return NextResponse.json({ trackUrl: null, error: e.message }, { status: 500 });
  }
}
