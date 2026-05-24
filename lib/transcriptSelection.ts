import type { Transcript } from "./types";

/** All word indices (transcript array indexes) from `fromIdx` through `toIdx` inclusive. */
export function wordIndicesInRange(
  transcript: Transcript,
  fromIdx: number,
  toIdx: number
): number[] {
  const lo = Math.min(fromIdx, toIdx);
  const hi = Math.max(fromIdx, toIdx);
  const indices: number[] = [];
  for (let i = lo; i <= hi; i++) {
    if (transcript.words[i]?.type === "word") indices.push(i);
  }
  return indices;
}

/** Toggle skip on every word in the range (skip all if any is unskipped). */
export function toggleSkipRange(
  prev: Set<number>,
  rangeIndices: number[]
): Set<number> {
  const next = new Set(prev);
  const allSkipped = rangeIndices.every((i) => next.has(i));
  for (const i of rangeIndices) {
    if (allSkipped) next.delete(i);
    else next.add(i);
  }
  return next;
}
