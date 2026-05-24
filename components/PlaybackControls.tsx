"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useVideoContext } from "@/lib/videoContext";
import { enableVideoAudio } from "@/lib/videoAudio";

function PlaybackControlsImpl() {
  const { videoRef } = useVideoContext();
  const sliderRef = useRef<HTMLInputElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const timeLabelRef = useRef<HTMLSpanElement | null>(null);
  const durationLabelRef = useRef<HTMLSpanElement | null>(null);
  const playIconRef = useRef<HTMLSpanElement | null>(null);
  const muteIconRef = useRef<HTMLSpanElement | null>(null);
  const isScrubbingRef = useRef(false);

  // Duration is React state — it changes once (on metadata load) and drives
  // the time-markers render below.
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v && sliderRef.current && timeLabelRef.current) {
        const dur = v.duration;
        if (Number.isFinite(dur) && dur > 0) {
          if (duration !== dur) setDuration(dur);
          if (!isScrubbingRef.current) {
            sliderRef.current.max = String(dur);
            sliderRef.current.value = String(v.currentTime);
            if (fillRef.current) {
              fillRef.current.style.width = `${(v.currentTime / dur) * 100}%`;
            }
          }
          timeLabelRef.current.textContent = fmt(v.currentTime);
          if (durationLabelRef.current) durationLabelRef.current.textContent = fmt(dur);
        }
        if (playIconRef.current) playIconRef.current.textContent = v.paused ? "▶" : "⏸";
        if (muteIconRef.current) muteIconRef.current.textContent = v.muted ? "🔇" : "🔊";
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [videoRef, duration]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      enableVideoAudio(v);
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted) enableVideoAudio(v);
    else v.muted = true;
  };

  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    isScrubbingRef.current = true;
    const t = parseFloat(e.target.value);
    v.currentTime = t;
    if (fillRef.current && v.duration > 0) {
      fillRef.current.style.width = `${(t / v.duration) * 100}%`;
    }
  };

  const releaseScrub = () => {
    isScrubbingRef.current = false;
  };

  const markers = computeMarkers(duration);

  return (
    <div className="px-6 py-4 bg-white border-t border-neutral-200">
      <div className="flex items-center justify-center gap-3 mb-3">
        <button
          onClick={togglePlay}
          aria-label="Play / Pause"
          className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white flex items-center justify-center shadow-md shadow-violet-200 transition-colors"
        >
          <span ref={playIconRef} className="text-base leading-none">▶</span>
        </button>
        <button
          onClick={toggleMute}
          aria-label="Mute / Unmute"
          className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors"
        >
          <span ref={muteIconRef} className="text-base leading-none">🔇</span>
        </button>
        <span className="text-sm text-neutral-700 tabular-nums">
          <span ref={timeLabelRef}>0:00</span>
          <span className="text-neutral-400 mx-1">/</span>
          <span ref={durationLabelRef} className="text-neutral-400">0:00</span>
        </span>
      </div>

      <div className="relative h-2">
        <div className="absolute inset-y-0 left-0 right-0 bg-neutral-200 rounded-full" />
        <div
          ref={fillRef}
          className="absolute inset-y-0 left-0 bg-violet-500 rounded-full pointer-events-none"
          style={{ width: "0%" }}
        />
        <input
          ref={sliderRef}
          type="range"
          min={0}
          max={1}
          step={0.01}
          defaultValue={0}
          onChange={onScrub}
          onMouseUp={releaseScrub}
          onMouseLeave={releaseScrub}
          onTouchEnd={releaseScrub}
          aria-label="Seek video"
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
        />
      </div>

      {markers.length > 0 && (
        <div className="relative mt-2 h-4">
          {markers.map((m) => (
            <span
              key={m.time}
              className="absolute -translate-x-1/2 text-[10px] text-neutral-400 tabular-nums select-none"
              style={{ left: `${m.percent}%` }}
            >
              {fmt(m.time)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Pick a sensible step so we end up with ~5–7 evenly spaced markers.
function computeMarkers(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return [];
  const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  const step = steps.find((s) => duration / s <= 7) ?? 600;
  const markers: { time: number; percent: number }[] = [];
  for (let t = 0; t <= duration + 0.0001; t += step) {
    markers.push({ time: Math.min(t, duration), percent: (t / duration) * 100 });
    if (t >= duration) break;
  }
  return markers;
}

const PlaybackControls = memo(PlaybackControlsImpl);
export default PlaybackControls;
