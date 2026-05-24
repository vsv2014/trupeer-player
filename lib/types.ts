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

export interface PlayerAssets {
  videoUrl: string;
  backgroundUrl: string;
}

export interface PlayerData {
  transcript: Transcript;
  assets: PlayerAssets;
}
