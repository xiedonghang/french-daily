import { prisma } from "./db";
import { searchFrenchVideos } from "./youtube";
import { generateQuiz } from "./quiz";

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

  const videos = await searchFrenchVideos();
  if (!videos.length) throw new Error("No suitable French video found");

  const video = videos[Math.floor(Math.random() * videos.length)];
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

  console.log("Fetched daily video:", saved.title);
  return saved;
}
