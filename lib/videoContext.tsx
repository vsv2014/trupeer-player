"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import type { PlayerAssets, SkipRange, Transcript } from "./types";
import { fetchPlayerData } from "./mockApi";

interface VideoContextValue {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  registerVideo: (el: HTMLVideoElement | null) => void;
  transcript: Transcript | null;
  assets: PlayerAssets | null;
  bootstrapLoading: boolean;
  skippedWordIds: Set<number>;
  setSkippedWordIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  skipRanges: React.MutableRefObject<SkipRange[]>;
  padding: number;
  setPadding: (v: number) => void;
  borderRadius: number;
  setBorderRadius: (v: number) => void;
}

const VideoContext = createContext<VideoContextValue | null>(null);

export function VideoContextProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const skipRanges = useRef<SkipRange[]>([]);
  const [skippedWordIds, setSkippedWordIds] = useState<Set<number>>(new Set());
  const [padding, setPadding] = useState(0.1);
  const [borderRadius, setBorderRadius] = useState(0.05);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [assets, setAssets] = useState<PlayerAssets | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPlayerData().then((data) => {
      if (!cancelled) {
        setTranscript(data.transcript);
        setAssets(data.assets);
        setBootstrapLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const registerVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
  }, []);

  return (
    <VideoContext.Provider
      value={{
        videoRef,
        registerVideo,
        transcript,
        assets,
        bootstrapLoading,
        skippedWordIds,
        setSkippedWordIds,
        skipRanges,
        padding,
        setPadding,
        borderRadius,
        setBorderRadius,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideoContext() {
  const ctx = useContext(VideoContext);
  if (!ctx) throw new Error("useVideoContext must be used inside VideoContextProvider");
  return ctx;
}
