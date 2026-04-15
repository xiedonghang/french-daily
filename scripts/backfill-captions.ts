import "dotenv/config";
import { prisma } from "../src/lib/db";
import { YoutubeTranscript } from "youtube-transcript";

(async () => {
  const videos = await prisma.video.findMany({
    where: { transcript: "" },
    select: { id: true, youtubeId: true, title: true },
  });

  console.log(`Found ${videos.length} videos without captions`);

  for (const v of videos) {
    try {
      const items = await YoutubeTranscript.fetchTranscript(v.youtubeId, { lang: "fr" });
      const captions = items.map((i) => ({ start: i.offset / 1000, dur: i.duration / 1000, text: i.text }));
      await prisma.video.update({ where: { id: v.id }, data: { transcript: JSON.stringify(captions) } });
      console.log(`✅ ${v.title} — ${captions.length} captions`);
    } catch (e: any) {
      console.log(`❌ ${v.title} — ${e.message}`);
    }
  }

  process.exit(0);
})();
