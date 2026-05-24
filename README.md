# Trupeer Player — Three.js Video + Synced Transcript

**Live demo:** https://trupeer-player.vercel.app  
**Repository:** https://github.com/vsv2014/trupeer-player

A single-page Next.js + TypeScript app that renders a video on a Three.js
`PlaneGeometry` with a synced word-by-word transcript sidebar, real-time
padding & border-radius sliders, and skip-words playback.

## Features

- **Three.js video player** — background image + video as `PlaneGeometry` meshes (`VideoTexture`).
- **Custom fragment shader** — SDF rounded-rect mask in GLSL (border radius in canvas, not CSS).
- **Padding & rounding sliders** — real-time updates on the video plane / shader.
- **Transcript sidebar** — mock API (`fetchPlayerData`, 500ms delay) with skeleton loading.
- **Synced word highlight** — `requestAnimationFrame` + `classList` (no React state per frame).
- **Skip portions** — drag-select or Shift+click range; struck-through; skipped during playback.
- **Click to seek** — click a word to jump `currentTime`.
- **Playback controls** — play/pause, mute, seekable timeline (DOM updates in rAF).

## Stack

- Next.js 16 (App Router) + TypeScript
- React 19, Three.js, Tailwind CSS v4

## Architecture

```
app/page.tsx              Layout + dynamic VideoPlayer
components/VideoPlayer    Reusable Three.js player (videoUrl, backgroundUrl props)
components/TranscriptPanel  Words, highlight, skip selection
components/PlaybackControls Play/pause, mute, timeline
components/VideoControls    Padding + border-radius sliders
lib/videoContext.tsx        Shared video ref, skip ranges, mock bootstrap
lib/mockApi.ts              fetchPlayerData() — transcript + asset URLs
lib/transcriptSelection.ts  Range selection helpers
```

## Running locally

```bash
npm install
npm run dev
# http://localhost:3000
```

Place `public/video.mp4` and `public/background.jpg` in the repo (not committed if large).

## Deploy

Push to `main` on GitHub; Vercel auto-deploys.

## MP4 export approach (discussion only)

1. **`ffmpeg.wasm`** in the browser for trim + concat without a backend.
2. Compute keep-ranges as the complement of skip ranges on `[0, duration]`.
3. Trim each segment, concat via demuxer, download blob URL.

Tradeoffs: large bundle (~25MB), slower than native FFmpeg. Production would use a backend worker with the same pipeline.

## Controls

| Action | Effect |
|--------|--------|
| Play | Start video; enables audio (autoplay starts muted) |
| Click word | Seek to timestamp |
| Drag across words | Skip / unskip selection |
| Shift+click | Set range start; Shift+click another word for range skip |
| Shift+click (single) | Toggle skip on one word |
