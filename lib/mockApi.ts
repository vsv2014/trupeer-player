import type { PlayerData } from "./types";
import transcriptData from "@/data/transcript.json";

const MOCK_DELAY_MS = 500;

/** Simulates fetching transcript + media URLs from a backend. */
export function fetchPlayerData(): Promise<PlayerData> {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          transcript: transcriptData as PlayerData["transcript"],
          assets: {
            videoUrl: "/video.mp4",
            backgroundUrl: "/background.jpg",
          },
        }),
      MOCK_DELAY_MS
    );
  });
}

/** @deprecated Use fetchPlayerData — kept for compatibility */
export function fetchTranscript(): Promise<PlayerData["transcript"]> {
  return fetchPlayerData().then((d) => d.transcript);
}
