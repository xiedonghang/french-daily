// YouTube Data API v3 — search for ~10min French videos with captions
const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

export interface YouTubeVideo {
  youtubeId: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  publishDate: string;
  description: string;
  hasFrenchCaption: boolean;
}

// Check if a video has French captions via InnerTube player API (includes auto-generated)
async function hasFrenchCaption(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
        },
        body: JSON.stringify({
          context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
          videoId,
        }),
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!Array.isArray(tracks)) return false;
    return tracks.some(
      (t: any) => t.languageCode === "fr" || t.languageCode?.startsWith("fr-")
    );
  } catch {
    return false;
  }
}

export async function searchFrenchVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY!;

  const queries = [
    "français facile podcast",
    "apprendre le français",
    "français authentique",
    "compréhension orale français",
    "actualités en français facile",
  ];
  const shuffled = queries.sort(() => Math.random() - 0.5);
  const all: YouTubeVideo[] = [];

  for (const query of shuffled) {
    const searchUrl = `${YOUTUBE_API}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=medium&relevanceLanguage=fr&videoCaption=closedCaption&maxResults=5&order=date&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (!searchData.items?.length) continue;

    const ids = searchData.items.map((i: any) => i.id.videoId).join(",");
    const detailUrl = `${YOUTUBE_API}/videos?part=contentDetails,snippet&id=${ids}&key=${apiKey}`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    const candidates = detailData.items?.filter((v: any) => {
      const dur = v.contentDetails.duration;
      const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return false;
      const mins =
        parseInt(match[1] || "0") * 60 +
        parseInt(match[2] || "0") +
        parseInt(match[3] || "0") / 60;
      return mins >= 7 && mins <= 13;
    });

    if (!candidates?.length) continue;

    // Verify French captions via official API
    for (const v of candidates) {
      const hasFr = await hasFrenchCaption(v.id);
      all.push({
        youtubeId: v.id,
        title: v.snippet.title,
        channel: v.snippet.channelTitle,
        duration: v.contentDetails.duration,
        thumbnail:
          v.snippet.thumbnails.high?.url ||
          v.snippet.thumbnails.default?.url,
        publishDate: v.snippet.publishedAt,
        description: v.snippet.description || "",
        hasFrenchCaption: hasFr,
      });
    }

    if (all.length >= 10) break;
  }

  // Prefer videos with confirmed French captions
  return all.sort((a, b) => (b.hasFrenchCaption ? 1 : 0) - (a.hasFrenchCaption ? 1 : 0));
}
