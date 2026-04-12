import { YoutubeTranscript } from "youtube-transcript";

export interface TranscriptSegment {
  text: string;
  offset: number;  // seconds
  duration: number; // seconds
}

export async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: "fr" });
  return items.map((i) => ({
    text: i.text,
    offset: i.offset / 1000,
    duration: i.duration / 1000,
  }));
}

export function transcriptToText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(" ");
}
