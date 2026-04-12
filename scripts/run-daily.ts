import "dotenv/config";
import { fetchDailyVideo } from "../src/lib/daily-fetch";

(async () => {
  try {
    const video = await fetchDailyVideo();
    console.log("✅ Daily video fetched:", video.title);
    process.exit(0);
  } catch (e: any) {
    console.error("❌ Failed:", e.message);
    process.exit(1);
  }
})();
