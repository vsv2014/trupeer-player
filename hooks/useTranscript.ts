"use client";

import { useVideoContext } from "@/lib/videoContext";

/** Transcript from shared bootstrap (mock API in VideoContextProvider). */
export function useTranscript() {
  const { transcript, bootstrapLoading } = useVideoContext();
  return { transcript, loading: bootstrapLoading };
}
