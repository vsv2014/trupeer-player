/** Browsers block autoplay with sound; call after a user gesture to enable audio. */
export function enableVideoAudio(video: HTMLVideoElement) {
  video.muted = false;
  video.volume = 1;
}
