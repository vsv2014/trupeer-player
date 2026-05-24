<<<<<<< HEAD
# Trupeer Player — Three.js Video + Synced Transcript

A single-page Next.js + TypeScript app that renders a video on a Three.js
`PlaneGeometry` with a synced word-by-word transcript sidebar, real-time
padding & border-radius sliders, and skip-words playback.

## Features

- **Three.js video player** — background image + video both rendered as
  `PlaneGeometry` meshes. Video texture updates every frame via `VideoTexture`.
- **Custom fragment shader** for border radius — SDF rounded-rect mask applied
  in GLSL so the rounded corners live *inside* the canvas (not via CSS).
- **Padding slider** — scales the video plane within the scene.
- **Border-radius slider** — pushes a uniform into the fragment shader.
- **Transcript sidebar** — fetched via a mock API (`setTimeout(500ms)`),
  rendered word-by-word with skeleton loading.
- **Real-time word highlight** — `requestAnimationFrame` loop reads
  `video.currentTime` and updates the active word via `classList` (no React
  state updates per frame).
- **Click to seek** — clicking a word jumps `video.currentTime`.
- **Skip words** — Shift+click toggles skip on a word; struck-through. During
  playback, the rAF loop detects when `currentTime` enters a skip range and
  programmatically seeks to the end of the range.
- **Smooth auto-scroll** — active word scrolls into view smoothly.
- **Playback controls** — Play/pause + seekable timeline. Slider is updated
  via direct DOM writes (`slider.value = ...`) in the rAF loop — no re-renders.

## Stack

- Next.js 16 (App Router) + TypeScript
- React 19
- Three.js (via `three` + `@types/three`)
- Tailwind CSS v4
- Geist font

## Architecture

```
app/
  page.tsx                    Main layout (sidebar + canvas) wrapped in VideoContextProvider
  layout.tsx                  Root layout with dark-theme body
  globals.css                 Tailwind + .word-active highlight class

components/
  VideoPlayer.tsx             Three.js scene — bg plane, video plane with shader, rAF loop
  TranscriptPanel.tsx         Word list, rAF-driven highlight via classList, click + shift-click
  PlaybackControls.tsx        Play/pause + timeline slider, rAF-driven sync
  VideoControls.tsx           Padding + border-radius sliders (useState — UI state)

hooks/
  useTranscript.ts            Mock API fetch with loading state

lib/
  types.ts                    Word / Transcript / SkipRange interfaces
  videoContext.tsx            Shared HTMLVideoElement ref + skip ranges ref + slider state
  mockApi.ts                  fetchTranscript() — Promise resolved after 500ms

data/
  transcript.json             30-word mock transcript with realistic timestamps
```

## Performance design

- **Single source of truth for playback state** = the `HTMLVideoElement` ref,
  not React state.
- **No state updates during playback** — `PlaybackControls` and
  `TranscriptPanel` each run a `requestAnimationFrame` loop, read
  `videoRef.current.currentTime`, and write DOM directly (`slider.value`,
  `el.classList.add('word-active')`).
- **`React.memo`** on `TranscriptPanel`, `PlaybackControls`, `VideoControls`
  to prevent parent re-renders from cascading.
- **Three.js component dynamically imported** with `{ ssr: false }` —
  prevents SSR errors and reduces initial bundle.
- **Binary search** for finding the active word index — O(log n) per frame.

## Running locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Tested in Chrome.

## Deploy

Push to GitHub. Connect to Vercel — auto-deploys with no config.

## Notes on MP4 export approach (not implemented)

If asked to export an edited MP4 (with skipped segments removed) without
backend support, the approach would be:

1. Use **`ffmpeg.wasm`** in the browser (compiled WebAssembly build of ffmpeg).
2. Sort skip ranges, compute keep-ranges as the complement on `[0, duration]`.
3. For each keep-range, run an ffmpeg trim command:
   `ffmpeg -ss <start> -to <end> -i input.mp4 -c copy partN.mp4`
4. Concatenate all parts via ffmpeg's `concat` demuxer.
5. Download the final MP4 via a blob URL.

Tradeoffs: ffmpeg.wasm is large (~25MB), slow vs native, and re-encoding can
hurt quality. For production, a backend FFmpeg worker would be the right
call. The shape of the work would otherwise be identical.

## Asset sources

- Video: `BigBuckBunny.mp4` (Google Cloud sample, CC-BY)
- Background: Unsplash forest photo (royalty-free)
=======
# trupeer-player
>>>>>>> a9cf57aaf6ba48b9ea281a3c001f1a33f75e9d51
