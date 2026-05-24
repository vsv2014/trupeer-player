"use client";

import { memo } from "react";
import { useVideoContext } from "@/lib/videoContext";

function VideoControlsImpl() {
  const { padding, setPadding, borderRadius, setBorderRadius } = useVideoContext();

  return (
    <div className="px-4 py-4 border-t border-neutral-200 space-y-4 bg-neutral-50">
      <Slider
        label="Padding"
        value={padding}
        display={Math.round(padding * 100)}
        max={0.4}
        onChange={setPadding}
        id="padding-slider"
      />
      <Slider
        label="Rounding"
        value={borderRadius}
        display={Math.round(borderRadius * 100)}
        max={0.3}
        onChange={setBorderRadius}
        id="radius-slider"
      />
    </div>
  );
}

function Slider({
  label,
  value,
  display,
  max,
  onChange,
  id,
}: {
  label: string;
  value: number;
  display: number;
  max: number;
  onChange: (v: number) => void;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-neutral-600 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <span className="text-[11px] tabular-nums text-neutral-400 w-5">00</span>
        <input
          id={id}
          type="range"
          min={0}
          max={max}
          step={0.005}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-violet-500"
        />
        <span className="text-[11px] tabular-nums text-neutral-700 font-medium w-8 text-right bg-white border border-neutral-200 rounded px-1.5 py-0.5">
          {display.toString().padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

const VideoControls = memo(VideoControlsImpl);
export default VideoControls;
