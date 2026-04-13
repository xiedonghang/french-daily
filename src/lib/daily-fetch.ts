import { prisma } from "./db";
import { searchFrenchVideos } from "./youtube";
import { generateQuiz } from "./quiz";

const MAX_RETRY_MS = 30 * 60 * 1000; // 30 minutes

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

  let delay = 30_000; // 30s initial
  const start = Date.now();

  while (Date.now() - start < MAX_RETRY_MS) {
    try {
      const result = await tryFetchVideo();
      if (result) return result;
    } catch (e: any) {
      console.error(`Fetch failed: ${e.message}`);
    }

    if (Date.now() - start + delay >= MAX_RETRY_MS) break;
    console.log(`Retrying in ${delay / 1000}s...`);
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 2, 240_000); // cap at 240s
  }

  throw new Error("Failed to fetch daily video after 30 minutes of retries");
}

async function tryFetchVideo() {
  const existingIds = new Set(
    (await prisma.video.findMany({ select: { youtubeId: true } })).map(
      (v) => v.youtubeId
    )
  );

  const videos = await searchFrenchVideos();
  // Skip videos already in DB, prefer French captions
  const candidates = videos.filter((v) => !existingIds.has(v.youtubeId));
  const video = candidates.find((v) => v.hasFrenchCaption) || candidates[0];
  if (!video) {
    console.log("All candidates already exist in DB, skipping");
    return null;
  }

  const questions = await generateQuiz({
    title: video.title,
    channel: video.channel,
    description: video.description,
  });

  const saved = await prisma.video.create({
    data: {
      youtubeId: video.youtubeId,
      title: video.title,
      channel: video.channel,
      duration: video.duration,
      thumbnail: video.thumbnail,
      transcript: "",
      publishDate: new Date(video.publishDate),
      questions: {
        create: questions.map((q, i) => ({ ...q, orderIndex: i })),
      },
    },
    include: { questions: true },
  });

  console.log("Fetched daily video:", saved.title, "| French caption:", video.hasFrenchCaption);
  return saved;
}
