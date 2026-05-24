"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranscript } from "@/hooks/useTranscript";
import { useVideoContext } from "@/lib/videoContext";
import { enableVideoAudio } from "@/lib/videoAudio";
import { toggleSkipRange, wordIndicesInRange } from "@/lib/transcriptSelection";
import type { Word } from "@/lib/types";

function TranscriptPanelImpl() {
  const { transcript, loading } = useTranscript();
  const { videoRef, skippedWordIds, setSkippedWordIds, skipRanges } = useVideoContext();

  const listRef = useRef<HTMLDivElement | null>(null);
  const lastHighlightedRef = useRef<HTMLElement | null>(null);
  const lastScrollIdxRef = useRef<number>(-1);
  const dragAnchorRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const shiftAnchorRef = useRef<number | null>(null);
  const [selectPreview, setSelectPreview] = useState<Set<number>>(new Set());
  const selectPreviewRef = useRef<Set<number>>(new Set());

  const wordIndices = useMemo(() => {
    if (!transcript) return [];
    const arr: number[] = [];
    transcript.words.forEach((w, i) => {
      if (w.type === "word") arr.push(i);
    });
    return arr;
  }, [transcript]);

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

  useEffect(() => {
    const endDrag = () => {
      if (!isDraggingRef.current || !transcript) {
        return;
      }
      if (dragMovedRef.current && selectPreviewRef.current.size > 0) {
        const indices = Array.from(selectPreviewRef.current);
        setSkippedWordIds((prev) => toggleSkipRange(prev, indices));
      }
      isDraggingRef.current = false;
      dragMovedRef.current = false;
      dragAnchorRef.current = null;
      selectPreviewRef.current = new Set();
      setSelectPreview(new Set());
    };

    window.addEventListener("mouseup", endDrag);
    return () => window.removeEventListener("mouseup", endDrag);
  }, [transcript, setSkippedWordIds]);

  const updateDragPreview = (fromIdx: number, toIdx: number) => {
    if (!transcript) return;
    const next = new Set(wordIndicesInRange(transcript, fromIdx, toIdx));
    selectPreviewRef.current = next;
    setSelectPreview(next);
  };

  const onWordMouseDown = (idx: number, e: React.MouseEvent) => {
    if (e.button !== 0 || e.shiftKey) return;
    e.preventDefault();
    dragAnchorRef.current = idx;
    isDraggingRef.current = true;
    shiftAnchorRef.current = null;
    updateDragPreview(idx, idx);
  };

  const onWordMouseEnter = (idx: number) => {
    if (!isDraggingRef.current || dragAnchorRef.current === null) return;
    if (idx !== dragAnchorRef.current) dragMovedRef.current = true;
    updateDragPreview(dragAnchorRef.current, idx);
  };

  const onWordClick = (idx: number, e: React.MouseEvent) => {
    const v = videoRef.current;
    if (!v || !transcript) return;

    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }

    if (e.shiftKey) {
      if (shiftAnchorRef.current !== null && shiftAnchorRef.current !== idx) {
        const range = wordIndicesInRange(transcript, shiftAnchorRef.current, idx);
        setSkippedWordIds((prev) => toggleSkipRange(prev, range));
        shiftAnchorRef.current = null;
        selectPreviewRef.current = new Set();
        setSelectPreview(new Set());
      } else if (shiftAnchorRef.current === idx) {
        setSkippedWordIds((prev) => {
          const next = new Set(prev);
          if (next.has(idx)) next.delete(idx);
          else next.add(idx);
          return next;
        });
        shiftAnchorRef.current = null;
        selectPreviewRef.current = new Set();
        setSelectPreview(new Set());
      } else {
        shiftAnchorRef.current = idx;
        const one = new Set([idx]);
        selectPreviewRef.current = one;
        setSelectPreview(one);
      }
      return;
    }

    shiftAnchorRef.current = null;
    enableVideoAudio(v);
    v.currentTime = transcript.words[idx].start;
    if (v.paused) v.play().catch(() => {});
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
          const inPreview = selectPreview.has(idx);
          return (
            <span
              key={idx}
              data-w={idx}
              onMouseDown={(e) => onWordMouseDown(idx, e)}
              onMouseEnter={() => onWordMouseEnter(idx)}
              onClick={(e) => onWordClick(idx, e)}
              className={`rounded cursor-pointer transition-colors select-none ${
                skipped
                  ? "line-through text-neutral-400"
                  : inPreview
                    ? "bg-violet-200 text-violet-900"
                    : "hover:bg-neutral-100"
              }`}
              title={`${w.start.toFixed(2)}s — drag or Shift+click range to skip`}
            >
              {w.text}
            </span>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-neutral-500">
        Click to seek • Drag or Shift+click start then Shift+click end to skip a
        range • Shift+click one word to toggle
      </p>
    </div>
  );
}

function isAdjacentWord(wordIndices: number[], a: number, b: number) {
  const ai = wordIndices.indexOf(a);
  return ai !== -1 && wordIndices[ai + 1] === b;
}

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
