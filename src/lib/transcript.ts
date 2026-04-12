import { execSync } from "child_process";

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export async function getTranscript(
  videoId: string
): Promise<TranscriptSegment[]> {
  const tmpFile = `/tmp/sub-${videoId}`;

  execSync(
    `yt-dlp --write-auto-sub --sub-lang fr --skip-download --sub-format json3 -o "${tmpFile}" "https://www.youtube.com/watch?v=${videoId}"`,
    { timeout: 30_000, stdio: "pipe" }
  );

  const { readFileSync, unlinkSync } = await import("fs");
  const path = `${tmpFile}.fr.json3`;
  const raw = readFileSync(path, "utf-8");
  unlinkSync(path);

  const data = JSON.parse(raw);
  if (!data.events?.length) throw new Error(`Empty captions for ${videoId}`);

  return data.events
    .filter((e: any) => e.segs)
    .map((e: any) => ({
      text: e.segs.map((s: any) => s.utf8 || "").join(""),
      offset: (e.tStartMs || 0) / 1000,
      duration: (e.dDurationMs || 0) / 1000,
    }))
    .filter((s: TranscriptSegment) => s.text.trim());
}

export function transcriptToText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(" ");
}
