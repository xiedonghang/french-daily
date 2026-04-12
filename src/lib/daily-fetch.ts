import { prisma } from "./db";
import { searchFrenchVideos } from "./youtube";
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

  // Try multiple videos — some have transcripts disabled
  const videos = await searchFrenchVideos();
  if (!videos.length) throw new Error("No suitable French video found");

  let video: typeof videos[0] | null = null;
  let segments: Awaited<ReturnType<typeof getTranscript>> = [];
  let plainText = "";
  const errors: string[] = [];

  for (const candidate of videos) {
    try {
      segments = await getTranscript(candidate.youtubeId);
      plainText = transcriptToText(segments);
      if (plainText && plainText.length >= 100) {
        video = candidate;
        break;
      }
      errors.push(`${candidate.youtubeId}: transcript too short (${plainText.length})`);
    } catch (e: any) {
      errors.push(`${candidate.youtubeId}: ${e.message}`);
    }
  }

  if (!video) {
    throw new Error(`No video with French transcript found. Tried ${videos.length} videos. Errors: ${errors.join("; ")}`);
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
