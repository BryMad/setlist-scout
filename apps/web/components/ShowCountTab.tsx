"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** Roadmap §0.0b choices (35 added on request). */
export const SHOW_COUNTS = [5, 10, 25, 35, 60, 100] as const;
export const DEFAULT_SHOW_COUNT = 60;

/**
 * The "Last N shows" mode tab: styled like its sibling tabs plus a caret.
 * Clicking it opens a menu of "Last N shows" choices; picking one navigates.
 * Tap-outside / Escape closes (TourStats toggletip pattern).
 */
export default function ShowCountTab({
  base,
  active,
  n,
}: {
  base: string;
  active: boolean;
  n: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
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

  // a hand-typed ?n= still appears in the list
  const counts = SHOW_COUNTS.includes(n as (typeof SHOW_COUNTS)[number])
    ? [...SHOW_COUNTS]
    : [...SHOW_COUNTS, n].sort((a, b) => a - b);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium ${
          active
            ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-300"
            : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
        }`}
      >
        Last {n} shows
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="menu"
          className="absolute left-0 top-10 z-20 min-w-full overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl shadow-black/40"
        >
          {counts.map((count) => {
            const current = active && count === n;
            return (
              <li key={count} role="none">
                <Link
                  role="menuitem"
                  href={`${base}&mode=last&n=${count}`}
                  onClick={() => setOpen(false)}
                  aria-current={current ? "true" : undefined}
                  className={`block whitespace-nowrap px-3 py-1.5 text-sm ${
                    current
                      ? "bg-indigo-500/10 text-indigo-300"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  }`}
                >
                  Last {count} shows
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
