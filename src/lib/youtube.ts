// YouTube Data API v3 — search for ~10min French videos
const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

interface YouTubeVideo {
  youtubeId: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  publishDate: string;
}

export async function searchFrenchVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY!;

  // Search for French educational/podcast content ~10 min
  const queries = [
    "français facile podcast",
    "apprendre le français",
    "français authentique",
    "compréhension orale français",
    "actualités en français facile",
  ];
  // Shuffle and try all queries to maximize candidates
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
      const mins = (parseInt(match[1] || "0") * 60) + parseInt(match[2] || "0") + (parseInt(match[3] || "0") / 60);
      return mins >= 7 && mins <= 13;
    });

    if (candidates?.length) {
      all.push(...candidates.map((v: any) => ({
        youtubeId: v.id,
        title: v.snippet.title,
        channel: v.snippet.channelTitle,
        duration: v.contentDetails.duration,
        thumbnail: v.snippet.thumbnails.high?.url || v.snippet.thumbnails.default?.url,
        publishDate: v.snippet.publishedAt,
      })));
    }

    if (all.length >= 10) break;
  }

  return all;
}
