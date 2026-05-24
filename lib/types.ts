export interface Word {
  text: string;
  start: number;
  end: number;
  type: string;     // "word" | "spacing"
  logprob?: number; // present in Trupeer-provided transcripts; not used
}

export interface Transcript {
  text: string;
  words: Word[];
}

export interface SkipRange {
  start: number;
  end: number;
}
