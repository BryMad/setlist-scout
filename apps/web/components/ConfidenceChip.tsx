"use client";

import { useEffect, useRef, useState } from "react";
import { CONFIDENCE_STYLE } from "./confidence";
import type { Confidence } from "@setlistscout/engine";

/**
 * The confidence chip IS the trigger: "HIGH CONFIDENCE ? ⌄" pops up a glass
 * card with the methodology notes. The card anchors slightly ABOVE the panel
 * and overlays the page (pop-up HUD, not an in-flow dropdown) — same pattern
 * as TourStats. Tap-outside, Escape, or the × closes it.
 */
export default function ConfidenceChip({
  confidence,
  lines,
}: {
  confidence: Confidence;
  lines: string[];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !cardRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wide transition hover:brightness-125 ${CONFIDENCE_STYLE[confidence]}`}
      >
        {confidence} confidence
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-current text-[9px] font-semibold">
          ?
        </span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1.5 3l2.5 2.5L6.5 3" />
        </svg>
      </button>

      {open && lines.length > 0 && (
        <div
          ref={cardRef}
          className="hud-pop absolute -top-3 left-1/2 z-50 w-[min(30rem,calc(100%+1.5rem))] -translate-x-1/2 rounded-2xl border border-indigo-400/25 bg-[#16142e] p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-indigo-500" />
              <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
                How we got this
              </span>
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded p-1 text-zinc-500 transition hover:text-zinc-200"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              >
                <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
              </svg>
            </button>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-zinc-300">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
