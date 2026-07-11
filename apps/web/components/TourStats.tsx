"use client";

import { useEffect, useRef, useState } from "react";
import type { TourStatsData } from "@/lib/tour-stats";

/**
 * "SEE TOUR STATS" — a chip trigger (same visual weight as the confidence
 * chip) opening a telemetry-style HUD. Toggletip pattern: click to open,
 * tap-outside/Escape closes. The card is positioned against the confidence
 * PANEL (nearest `relative` ancestor), spanning its full width below.
 *
 * Tech look = the confidence chip's language turned up quietly: mono
 * uppercase micro-labels, tabular numerals, hairline rules — no glows.
 */
export default function TourStats({ stats }: { stats: TourStatsData }) {
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

  const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </span>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wide transition ${
          open
            ? "border-zinc-400 bg-zinc-400/15 text-zinc-100"
            : "border-zinc-600 bg-zinc-500/10 text-zinc-300 hover:border-zinc-400 hover:text-zinc-100"
        }`}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          <path d="M1.5 10.5v-4M6 10.5v-9M10.5 10.5v-6" />
        </svg>
        See tour stats
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

      {open && (
        // glass pop-up HUD: anchored a touch ABOVE the panel and floating
        // over the page (song list blurs beneath) — a modal layer, not an
        // expanded section of the scroll
        <div
          ref={cardRef}
          className="hud-pop absolute -top-3 left-1/2 z-50 w-[min(36rem,calc(100%+1.5rem))] -translate-x-1/2 rounded-2xl border border-indigo-400/25 bg-[#16142e] p-5 shadow-2xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 bg-indigo-500" />
              <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
                Tour stats
              </span>
            </span>
            <span className="flex items-center gap-3">
              <span className="font-mono text-xs tabular-nums text-zinc-400">
                <span className="uppercase tracking-wide text-zinc-500">
                  Date range:
                </span>{" "}
                {stats.from} → {stats.to}
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
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { value: stats.shows, label: "shows" },
              { value: stats.avgSongs, label: "avg songs per show" },
              { value: stats.distinctSongs, label: "different songs" },
            ].map((tile) => (
              <div
                key={tile.label}
                className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-zinc-950/50 px-3 py-2 text-center"
              >
                <span className="block font-mono text-2xl font-semibold leading-none tabular-nums text-zinc-100">
                  {tile.value}
                </span>
                <Label>{tile.label}</Label>
              </div>
            ))}
          </div>

          {(stats.usualOpener || stats.likelyEncores.length > 0 || stats.usualCloser) && (
            // the encore box carries more entries, so it gets the lion's share;
            // no-encore artists get an even opener/closer split instead
            <div
              className={`mt-4 grid gap-2 ${
                stats.likelyEncores.length > 0
                  ? "sm:grid-cols-[1fr_1.75fr]"
                  : "sm:grid-cols-2"
              }`}
            >
              {stats.usualOpener && (
                <div className="rounded-lg border border-white/10 bg-zinc-950/50 px-3 py-2.5">
                  <Label>Usual opener</Label>
                  <p className="mt-1 truncate text-sm font-medium text-zinc-100">
                    {stats.usualOpener.name}
                  </p>
                  <p className="font-mono text-[10px] tabular-nums text-zinc-500">
                    opened {stats.usualOpener.count} of {stats.shows} shows
                  </p>
                </div>
              )}
              {stats.likelyEncores.length === 0 && stats.usualCloser && (
                // no encores on this tour (straight-through sets) — the show
                // still ends somewhere: surface the closer instead
                <div className="rounded-lg border border-white/10 bg-zinc-950/50 px-3 py-2.5">
                  <Label>Usual closer</Label>
                  <p
                    className="mt-1 truncate text-sm font-medium text-zinc-100"
                    title={stats.usualCloser.name}
                  >
                    {stats.usualCloser.name}
                  </p>
                  <p className="font-mono text-[10px] tabular-nums text-zinc-500">
                    closed {stats.usualCloser.count} of {stats.shows} shows
                  </p>
                </div>
              )}
              {stats.likelyEncores.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-zinc-950/50 px-3 py-2.5">
                  <Label>Likely encore</Label>
                  {/* stacked like the opener (count under name); two columns
                      once the staple list grows */}
                  <div
                    className={`gap-x-6 gap-y-2 ${
                      stats.likelyEncores.length > 1 ? "grid grid-cols-2" : ""
                    }`}
                  >
                    {stats.likelyEncores.map((song) => (
                      <div key={song.name} className="mt-1 min-w-0">
                        <p
                          className="truncate text-sm font-medium text-zinc-100"
                          title={song.name}
                        >
                          {song.name}
                        </p>
                        <p className="font-mono text-[10px] tabular-nums text-zinc-500">
                          {song.count}× encored
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {stats.albums.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-indigo-500" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  Where the songs come from
                </span>
              </div>
              <ul className="mt-3 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {stats.albums.map((album) => (
                  <li key={album.name}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className="min-w-0 truncate text-xs text-zinc-300"
                        title={album.name}
                      >
                        {album.name}
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                        {album.pct < 1 ? "<1" : album.pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800/60">
                      <div
                        className={`h-full rounded-full ${
                          album.isCovers ? "bg-zinc-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${Math.max(album.pct, 2)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}
