"use client";

import { useEffect, useRef, useState } from "react";

const TONES = [
  {
    id: "corporate-en",
    label: "Corporate English",
    color: "#3D8B7A",
    text: "Three quarters into our regional rollout, the lesson wasn't the tooling — it was sequencing. Teams that agreed on ownership before the kickoff shipped twice as fast as those that didn't.",
  },
  {
    id: "humble-local",
    label: "Humble local",
    color: "#C69C4B",
    text: "Took us three tries to get this rollout right, and honestly the tech was never the hard part. The moment we sat down and agreed who owns what — that's when things moved.",
  },
  {
    id: "manglish",
    label: "Manglish",
    color: "#C1553D",
    text: "Confession: took us 3 rounds to get this rollout right. Turns out the tools were never the problem lah — once everyone agreed who owns what, things moved fast already.",
  },
] as const;

export default function ToneDemo() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced || paused) return;

    intervalRef.current = setInterval(() => {
      setActive((current) => (current + 1) % TONES.length);
    }, 4200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  const current = TONES[active];

  return (
    <div
      className="mx-auto w-full max-w-md"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex gap-1 rounded-full bg-white/5 p-1">
        {TONES.map((tone, index) => (
          <button
            key={tone.id}
            type="button"
            onClick={() => setActive(index)}
            className="relative flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors"
            style={{
              color: index === active ? "#0B0F0E" : "rgba(245,245,242,0.6)",
              backgroundColor: index === active ? "#F5F5F2" : "transparent",
            }}
            aria-pressed={index === active}
          >
            {tone.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: current.color }}
          >
            YN
          </span>
          <div>
            <p className="text-sm font-medium text-ink">Your Name</p>
            <p className="text-xs text-ink/45">Just now · edited with Sambungla</p>
          </div>
        </div>

        <p
          key={current.id}
          className="mt-4 min-h-[6.5rem] text-[15px] leading-relaxed text-ink/85"
        >
          {current.text}
        </p>

        <div className="mt-5 flex items-center gap-5 border-t border-ink/10 pt-4 text-xs text-ink/40">
          <span>Like</span>
          <span>Comment</span>
          <span>Share</span>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-white/40">
        Same idea, one tap to switch. Tap a tab to try it yourself.
      </p>
    </div>
  );
}
