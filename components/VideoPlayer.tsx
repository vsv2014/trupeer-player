"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useVideoContext } from "@/lib/videoContext";

export interface VideoPlayerProps {
  videoUrl: string;
  backgroundUrl: string;
}

// SDF rounded-rect mask. Pixels outside the shape are discarded.
const VIDEO_FRAG = `
  uniform sampler2D map;
  uniform float uRadius;
  varying vec2 vUv;

  float sdRoundedRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
    vec2 pos = (vUv - 0.5) * 2.0;
    if (sdRoundedRect(pos, vec2(1.0), uRadius) > 0.0) discard;
    gl_FragColor = vec4(texture2D(map, vUv).rgb, 1.0);
  }
`;

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export default function VideoPlayer({ videoUrl, backgroundUrl }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isSeekingRef = useRef(false);

  const { registerVideo, padding, borderRadius, skipRanges } = useVideoContext();

  const videoPlaneRef = useRef<THREE.Mesh | null>(null);
  const radiusUniformRef = useRef<{ value: number } | null>(null);

  const paddingRef = useRef(padding);
  useEffect(() => {
    paddingRef.current = padding;
  }, [padding]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const scene = new THREE.Scene();

    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0xffffff, 1);
    container.appendChild(renderer.domElement);

    const bgGeometry = new THREE.PlaneGeometry(2 * aspect, 2);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.z = -0.1;
    scene.add(bgMesh);

    const bgLoader = new THREE.TextureLoader();
    bgLoader.load(backgroundUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      bgMaterial.map = tex;
      bgMaterial.color = new THREE.Color(0xffffff);
      bgMaterial.needsUpdate = true;
    });

    // Muted for autoplay; unmuted on user gesture in PlaybackControls.
    const video = document.createElement("video");
    video.loop = true;
    video.muted = true;
    video.volume = 1;
    video.playsInline = true;
    video.preload = "auto";
    video.autoplay = true;
    video.style.display = "none";
    video.src = videoUrl;
    container.appendChild(video);
    video.load();
    registerVideo(video);

    video.addEventListener(
      "canplay",
      () => {
        video.play().catch(() => {});
      },
      { once: true }
    );
    video.addEventListener("error", () => {
      console.warn("video failed to load:", videoUrl);
    });

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    const radiusUniform = { value: borderRadius };
    radiusUniformRef.current = radiusUniform;

    const videoMaterial = new THREE.ShaderMaterial({
      uniforms: { map: { value: videoTexture }, uRadius: radiusUniform },
      vertexShader: VERT,
      fragmentShader: VIDEO_FRAG,
      transparent: true,
    });

    const videoGeometry = new THREE.PlaneGeometry(1, 1);
    const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
    videoPlaneRef.current = videoMesh;
    scene.add(videoMesh);

    let currentAspect = aspect;

    function rescaleVideoPlane() {
      if (!videoPlaneRef.current) return;
      const p = paddingRef.current;
      const fit = Math.min(2 * currentAspect, 2) * (1 - p);
      const videoAspect =
        video.videoWidth && video.videoHeight
          ? video.videoWidth / video.videoHeight
          : 16 / 9;
      let w = fit;
      let h = fit / videoAspect;
      if (h > 2 * (1 - p)) {
        h = 2 * (1 - p);
        w = h * videoAspect;
      }
      videoPlaneRef.current.scale.set(w, h, 1);
    }
    rescaleVideoPlane();
    video.addEventListener("loadedmetadata", rescaleVideoPlane);
    (videoMesh as unknown as { _rescale: () => void })._rescale = rescaleVideoPlane;

    const tick = () => {
      if (!isSeekingRef.current && video.duration > 0 && !video.paused) {
        const t = video.currentTime;
        for (const r of skipRanges.current) {
          if (t >= r.start && t < r.end) {
            isSeekingRef.current = true;
            video.currentTime = Math.min(r.end + 0.01, video.duration - 0.05);
            const onSeeked = () => {
              isSeekingRef.current = false;
              video.removeEventListener("seeked", onSeeked);
            };
            video.addEventListener("seeked", onSeeked);
            break;
          }
        }
      }
      renderer.render(scene, camera);
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const a = w / h;
      currentAspect = a;
      camera.left = -a;
      camera.right = a;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      bgMesh.scale.set(a, 1, 1);
      rescaleVideoPlane();
    };
    onResize();
    window.addEventListener("resize", onResize);

    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener("resize", onResize);
      video.removeEventListener("loadedmetadata", rescaleVideoPlane);
      registerVideo(null);
      renderer.dispose();
      videoTexture.dispose();
      bgGeometry.dispose();
      videoGeometry.dispose();
      bgMaterial.dispose();
      videoMaterial.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      if (video.parentNode === container) {
        container.removeChild(video);
      }
    };
  }, [videoUrl, backgroundUrl, registerVideo, skipRanges, borderRadius]);

  useEffect(() => {
    const mesh = videoPlaneRef.current as
      | (THREE.Mesh & { _rescale?: () => void })
      | null;
    mesh?._rescale?.();
  }, [padding]);

  useEffect(() => {
    if (radiusUniformRef.current) {
      radiusUniformRef.current.value = borderRadius;
    }
  }, [borderRadius]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-white overflow-hidden" />
  );
}
