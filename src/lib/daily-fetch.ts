import { prisma } from "./db";
import { searchFrenchVideo } from "./youtube";
import { getTranscript, transcriptToText } from "./transcript";
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

  const video = await searchFrenchVideo();
  if (!video) throw new Error("No suitable French video found");

  const segments = await getTranscript(video.youtubeId);
  const plainText = transcriptToText(segments);
  if (!plainText || plainText.length < 100) {
    throw new Error("No French transcript available for " + video.youtubeId);
  }

  const questions = await generateQuiz(plainText);

  const saved = await prisma.video.create({
    data: {
      youtubeId: video.youtubeId,
      title: video.title,
      channel: video.channel,
      duration: video.duration,
      thumbnail: video.thumbnail,
      transcript: JSON.stringify(segments),
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
