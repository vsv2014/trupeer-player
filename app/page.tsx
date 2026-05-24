"use client";

import dynamic from "next/dynamic";
import TranscriptPanel from "@/components/TranscriptPanel";
import PlaybackControls from "@/components/PlaybackControls";
import VideoControls from "@/components/VideoControls";
import { VideoContextProvider } from "@/lib/videoContext";

const VideoPlayer = dynamic(() => import("@/components/VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-50 text-neutral-500 text-sm">
      Loading player…
    </div>
  ),
});

export default function HomePage() {
  return (
    <VideoContextProvider>
      <main className="flex flex-col md:flex-row h-screen w-screen bg-white text-neutral-900 overflow-hidden">
        <aside className="w-full md:w-[380px] md:min-w-[320px] flex flex-col border-b md:border-b-0 md:border-r border-neutral-200 bg-neutral-50 max-h-[40vh] md:max-h-none">
          <header className="px-4 py-3 border-b border-neutral-200 shrink-0">
            <h1 className="text-base font-semibold tracking-tight text-neutral-900">
              Trupeer Player
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Three.js video • Synced script
            </p>
          </header>
          <TranscriptPanel />
          <VideoControls />
        </aside>

        <section className="flex-1 flex flex-col bg-white min-w-0 min-h-0">
          <div className="flex-1 min-h-0">
            <VideoPlayer />
          </div>
          <PlaybackControls />
        </section>
      </main>
    </VideoContextProvider>
  );
}
