import type { Transcript } from "./types";
import transcriptData from "@/data/transcript.json";

export function fetchTranscript(): Promise<Transcript> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(transcriptData as Transcript), 500);
  });
}
