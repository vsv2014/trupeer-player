"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useTranscript } from "@/hooks/useTranscript";
import { useVideoContext } from "@/lib/videoContext";
import type { Word } from "@/lib/types";

function TranscriptPanelImpl() {
  const { transcript, loading } = useTranscript();
  const { videoRef, skippedWordIds, setSkippedWordIds, skipRanges } = useVideoContext();

  const listRef = useRef<HTMLDivElement | null>(null);
  const lastHighlightedRef = useRef<HTMLElement | null>(null);
  const lastScrollIdxRef = useRef<number>(-1);

  // Indices of actual "word" entries (skip "spacing" entries).
  const wordIndices = useMemo(() => {
    if (!transcript) return [];
    const arr: number[] = [];
    transcript.words.forEach((w, i) => {
      if (w.type === "word") arr.push(i);
    });
    return arr;
  }, [transcript]);

  // Recompute merged skip ranges whenever the skip set changes.
  useEffect(() => {
    if (!transcript) {
      skipRanges.current = [];
      return;
    }
    const sortedIds = Array.from(skippedWordIds).sort((a, b) => a - b);
    const ranges: { start: number; end: number }[] = [];
    let i = 0;
    while (i < sortedIds.length) {
      let j = i;
      while (
        j + 1 < sortedIds.length &&
        isAdjacentWord(wordIndices, sortedIds[j], sortedIds[j + 1])
      ) {
        j++;
      }
      const a = transcript.words[sortedIds[i]];
      const b = transcript.words[sortedIds[j]];
      if (a && b) ranges.push({ start: a.start, end: b.end });
      i = j + 1;
    }
    skipRanges.current = ranges;
  }, [skippedWordIds, transcript, skipRanges, wordIndices]);

  // Highlight the active word via classList — no React state per frame.
  useEffect(() => {
    if (!transcript || wordIndices.length === 0) return;
    const words = transcript.words;
    let rafId = 0;

    const tick = () => {
      const v = videoRef.current;
      if (v && listRef.current) {
        const idx = findActiveWord(words, wordIndices, v.currentTime);
        if (idx >= 0) {
          const el = listRef.current.querySelector<HTMLElement>(`[data-w="${idx}"]`);
          if (el && el !== lastHighlightedRef.current) {
            lastHighlightedRef.current?.classList.remove("word-active");
            el.classList.add("word-active");
            lastHighlightedRef.current = el;
            if (idx !== lastScrollIdxRef.current) {
              lastScrollIdxRef.current = idx;
              el.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
          }
        } else if (lastHighlightedRef.current) {
          lastHighlightedRef.current.classList.remove("word-active");
          lastHighlightedRef.current = null;
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [transcript, videoRef, wordIndices]);

  const onWordClick = (idx: number, e: React.MouseEvent) => {
    const v = videoRef.current;
    if (!v || !transcript) return;
    if (e.shiftKey) {
      setSkippedWordIds((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        return next;
      });
    } else {
      v.currentTime = transcript.words[idx].start;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-neutral-200 rounded animate-pulse"
            style={{ width: `${40 + ((i * 17) % 50)}%` }}
          />
        ))}
      </div>
    );
  }

  if (!transcript) return null;

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 text-neutral-800">
      <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Script</p>
      <div className="text-[15px] leading-7">
        {transcript.words.map((w, idx) => {
          if (w.type !== "word") return <span key={idx}>{w.text}</span>;
          const skipped = skippedWordIds.has(idx);
          return (
            <span
              key={idx}
              data-w={idx}
              onClick={(e) => onWordClick(idx, e)}
              className={`rounded cursor-pointer transition-colors select-none ${
                skipped ? "line-through text-neutral-400" : "hover:bg-neutral-100"
              }`}
              title={`${w.start.toFixed(2)}s — shift+click to ${skipped ? "unskip" : "skip"}`}
            >
              {w.text}
            </span>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-neutral-500">
        Click a word to seek • Shift+click to skip/unskip
      </p>
    </div>
  );
}

function isAdjacentWord(wordIndices: number[], a: number, b: number) {
  const ai = wordIndices.indexOf(a);
  return ai !== -1 && wordIndices[ai + 1] === b;
}

// Binary search over word entries. If `t` falls in a spacing gap, return the
// most recent past word.
function findActiveWord(words: Word[], wordIndices: number[], t: number) {
  let lo = 0;
  let hi = wordIndices.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const w = words[wordIndices[mid]];
    if (t < w.start) hi = mid - 1;
    else if (t >= w.end) lo = mid + 1;
    else return wordIndices[mid];
  }
  return hi >= 0 ? wordIndices[hi] : -1;
}

const TranscriptPanel = memo(TranscriptPanelImpl);
export default TranscriptPanel;
