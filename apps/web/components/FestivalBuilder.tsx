"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import SavePlaylist from "./SavePlaylist";
import type { FestivalArtistData } from "@/lib/data";
import type { Festival } from "@/lib/festivals";

/* Festival playlist builder. The lineup renders instantly; each act hydrates
   through its own /api/festival-artist call (limited concurrency), so cold
   festivals fill in progressively and warm ones snap in. */

const CONCURRENCY = 4;

type ActState = { status: "loading" } | { status: "error" } | FestivalArtistData;

const DEPTHS = [
  { key: "1", label: "The lock", per: "1 song each" },
  { key: "3", label: "Top 3", per: "3 songs each" },
  { key: "5", label: "Top 5", per: "5 songs each" },
  { key: "likely", label: "Everything likely", per: "all songs ≥40%" },
] as const;

type DepthKey = (typeof DEPTHS)[number]["key"];

function songsForDepth(data: FestivalArtistData, depth: DepthKey) {
  if (depth === "likely") return data.songs.filter((song) => song.pct >= 40);
  return data.songs.slice(0, Number(depth));
}

export default function FestivalBuilder({ festival }: { festival: Festival }) {
  const [acts, setActs] = useState<Record<string, ActState>>({});
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [depth, setDepth] = useState<DepthKey>("3");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const queue = [...festival.lineup.map((act) => act.name)];
    setActs(Object.fromEntries(queue.map((name) => [name, { status: "loading" as const }])));

    const worker = async () => {
      for (;;) {
        const name = queue.shift();
        if (!name) return;
        try {
          const res = await fetch(`/api/festival-artist?name=${encodeURIComponent(name)}`);
          if (!res.ok) throw new Error();
          const data = (await res.json()) as FestivalArtistData;
          setActs((prev) => ({ ...prev, [name]: data }));
        } catch {
          setActs((prev) => ({ ...prev, [name]: { status: "error" } }));
        }
      }
    };
    for (let i = 0; i < CONCURRENCY; i++) void worker();
  }, [festival]);

  const toggle = (name: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const { uris, artistCount, doneCount } = useMemo(() => {
    const collected: string[] = [];
    let withSongs = 0;
    let done = 0;
    for (const act of festival.lineup) {
      const state = acts[act.name];
      if (!state) continue;
      if (state.status !== "loading") done += 1;
      if (state.status !== "ok" || excluded.has(act.name)) continue;
      const picked = songsForDepth(state, depth)
        .map((song) => song.uri)
        .filter((uri): uri is string => Boolean(uri));
      if (picked.length > 0) withSongs += 1;
      collected.push(...picked);
    }
    return { uris: collected, artistCount: withSongs, doneCount: done };
  }, [acts, excluded, depth, festival]);

  const total = festival.lineup.length;

  return (
    <>
      {/* depth pills — the "what kind of playlist" choice */}
      <nav className="cascade-in mt-6 flex flex-wrap items-center gap-2 [animation-delay:120ms]">
        {DEPTHS.map((d) => (
          <button
            key={d.key}
            onClick={() => setDepth(d.key)}
            title={d.per}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              depth === d.key
                ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-300"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            {d.label}
          </button>
        ))}
      </nav>

      {/* save panel */}
      <section className="cascade-in mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 [animation-delay:180ms]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-zinc-500">
            {doneCount < total
              ? `analyzing lineup… ${doneCount}/${total} artists`
              : `${uris.length} songs from ${artistCount} artists`}
          </span>
          {doneCount < total && (
            <span className="h-1 w-24 overflow-hidden rounded-full bg-zinc-800">
              <span
                className="block h-full rounded-full bg-indigo-500 transition-[width] duration-500"
                style={{ width: `${(doneCount / total) * 100}%` }}
              />
            </span>
          )}
        </div>
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <SavePlaylist
            playlistName={`${festival.name} ${festival.year} — Setlist Scout`}
            description={`Predicted setlists for ${festival.name} ${festival.year} (${festival.location}). Made with SetlistScout.`}
            uris={uris}
          />
        </div>
      </section>

      {/* lineup */}
      <ol className="mt-6 space-y-1.5">
        {festival.lineup.map((act, index) => {
          const state = acts[act.name];
          const checked = !excluded.has(act.name);
          const ok = state && state.status === "ok";
          return (
            <li
              key={act.name}
              className="cascade-in row-lit grid grid-cols-[1.5rem_2.5rem_1fr_auto] items-center gap-3 rounded-r-lg px-2 py-2"
              style={{ animationDelay: `${240 + Math.min(index, 12) * 50}ms` }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(act.name)}
                disabled={!ok}
                className="h-4 w-4 accent-indigo-600 disabled:opacity-30"
              />
              {ok && state.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state.image} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-zinc-900" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {ok && state.mbid ? (
                    <Link
                      href={`/artist/${state.mbid}?name=${encodeURIComponent(state.name)}`}
                      className="hover:underline"
                    >
                      {state.name}
                    </Link>
                  ) : (
                    act.name
                  )}
                  {act.tier === "headliner" && (
                    <span className="ml-2 rounded border border-indigo-500/40 px-1.5 py-0.5 font-mono text-[10px] font-normal uppercase tracking-wide text-indigo-300">
                      headliner
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {!state || state.status === "loading"
                    ? "analyzing recent shows…"
                    : state.status === "error"
                      ? "lookup failed"
                      : state.status === "no-match"
                        ? "couldn't match on setlist.fm — skipped"
                        : state.status === "no-shows"
                          ? "no recent setlist data — skipped"
                          : `surest bet: “${state.songs[0]?.title ?? "?"}” · ~${state.typicalSetLength} songs a set`}
                </p>
              </div>
              <span className="font-mono text-xs text-zinc-600">
                {ok ? `${songsForDepth(state, depth).filter((s) => s.uri).length} songs` : "—"}
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
