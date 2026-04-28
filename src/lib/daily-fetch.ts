import { prisma } from "./db";
import { searchFrenchVideos } from "./youtube";
import { generateQuiz } from "./quiz";
import { YoutubeTranscript } from "youtube-transcript";

export async function fetchDailyVideo() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.video.findFirst({
    where: { fetchDate: { gte: today } },
  });
  if (existing) {
    console.log("Today's video already exists:", existing.youtubeId);
    return existing;
  }

  const existingIds = new Set(
    (await prisma.video.findMany({ select: { youtubeId: true } })).map(
      (v) => v.youtubeId
    )
  );

  const videos = await searchFrenchVideos();
  const candidates = videos.filter((v) => !existingIds.has(v.youtubeId));
  const video = candidates.find((v) => v.hasFrenchCaption) || candidates[0];
  if (!video) {
    throw new Error("No new video candidates found");
  }

  const questions = await generateQuiz({
    title: video.title,
    channel: video.channel,
    description: video.description,
  });

  // Fetch French captions — try fr, then fall back to any available language
  let transcript = "";
  try {
    const items = await YoutubeTranscript.fetchTranscript(video.youtubeId, { lang: "fr" });
    const captions = items.map((i) => ({ start: i.offset / 1000, dur: i.duration / 1000, text: i.text }));
    transcript = JSON.stringify(captions);
  } catch (e: any) {
    console.warn("French caption fetch failed:", e.message);
    // Fallback: try without specifying language (gets default/auto-generated)
    try {
      const items = await YoutubeTranscript.fetchTranscript(video.youtubeId);
      const captions = items.map((i) => ({ start: i.offset / 1000, dur: i.duration / 1000, text: i.text }));
      transcript = JSON.stringify(captions);
      console.log("Fetched fallback captions:", captions.length, "segments");
    } catch (e2: any) {
      console.warn("Fallback caption fetch also failed:", e2.message);
    }
  }

  const saved = await prisma.video.create({
    data: {
      youtubeId: video.youtubeId,
      title: video.title,
      channel: video.channel,
      duration: video.duration,
      thumbnail: video.thumbnail,
      transcript,
      publishDate: new Date(video.publishDate),
      questions: {
        create: questions.map((q, i) => ({ ...q, orderIndex: i })),
      },
    },
    include: { questions: true },
  });

  console.log("Fetched daily video:", saved.title, "| transcript:", transcript.length > 2 ? "✅" : "❌");
  return saved;
}
