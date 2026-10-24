"use client";

import { useEffect, useRef, useState } from "react";

/** A song as the save route needs it — most likely first. */
export interface SaveSong {
  key: string;
  name: string;
  coverArtist: string | null;
}

interface SaveOptions {
  limitOn: boolean;
  limit: number;
  groupByAlbum: boolean;
  preferLive: boolean;
  artistCovers: boolean;
}

interface SavePlaylistProps {
  playlistName: string;
  description: string;
  /** Used instead of `description` when the playlist is grouped by album. */
  descriptionByAlbum?: string;
  /** Ready-made track list (festival builder). Ignored when `build` is set. */
  uris?: string[];
  /**
   * Build the playlist server-side from these songs, with a Save options
   * popover. `defaultLimit` reproduces the page's old fixed playlist size
   * (null = every song).
   */
  build?: { artist: string; songs: SaveSong[]; defaultLimit: number | null };
}

/** sessionStorage marker: a save that got interrupted by the OAuth round-trip. */
const RESUME_KEY = "setlistscout:resume-save";
const LIMITS = [10, 20, 30, 50, 100];
/** The page pre-matches the top 60 songs; past that, saving does fresh
 *  Spotify lookups and can take a while on a cold cache. */
const LONG_PLAYLIST = 60;

export default function SavePlaylist({
  playlistName,
  description,
  descriptionByAlbum,
  uris = [],
  build,
}: SavePlaylistProps) {
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<SaveOptions>(() => ({
    limitOn: build?.defaultLimit != null,
    limit: build?.defaultLimit ?? 20,
    groupByAlbum: false,
    preferLive: false,
    artistCovers: false,
  }));

  const songCount = build
    ? options.limitOn
      ? Math.min(options.limit, build.songs.length)
      : build.songs.length
    : uris.length;

  // Mode/depth switches swap the props but React keeps this component (and its
  // "open saved playlist" link) alive — drop the link when the page is showing
  // a different song list. Tweaking save options keeps it: the earlier
  // playlist still exists, and the user may be saving a variant alongside it.
  const contentKey = build
    ? `${playlistName}::${build.songs.map((s) => s.key).join(",")}`
    : `${playlistName}::${uris.join(",")}`;
  const lastContentKey = useRef(contentKey);
  useEffect(() => {
    if (lastContentKey.current === contentKey) return;
    lastContentKey.current = contentKey;
    setState("idle");
    setPlaylistUrl(null);
  }, [contentKey]);

  // Auto-resume after login: if a save on THIS page was interrupted by the
  // OAuth redirect, finish it now (with the options that were chosen) instead
  // of making the user click twice. Requires the track list to be complete at
  // mount — true on server-rendered pages; the festival builder mounts with
  // an empty, still-loading list and is deliberately skipped.
  useEffect(() => {
    type Marker = { path?: string; at?: number; options?: SaveOptions };
    const marker = ((): Marker | null => {
      try {
        const raw = sessionStorage.getItem(RESUME_KEY);
        if (!raw) return null;
        sessionStorage.removeItem(RESUME_KEY);
        return JSON.parse(raw) as Marker;
      } catch {
        return null;
      }
    })();
    if (!marker) return;
    const here = window.location.pathname + window.location.search;
    const fresh = Date.now() - (marker.at ?? 0) < 5 * 60_000;
    if (marker.path !== here || !fresh || songCount === 0) return;
    if (marker.options) setOptions(marker.options);
    void save(marker.options ?? options);
    // mount-only: the marker is consumed on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(opts: SaveOptions = options) {
    setState("saving");
    const body = build
      ? {
          name: playlistName,
          description: opts.groupByAlbum && descriptionByAlbum ? descriptionByAlbum : description,
          artist: build.artist,
          songs: build.songs,
          options: {
            limit: opts.limitOn ? opts.limit : null,
            groupByAlbum: opts.groupByAlbum,
            preferLive: opts.preferLive,
            artistCovers: opts.artistCovers,
          },
        }
      : { name: playlistName, description, uris };
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        const path = window.location.pathname + window.location.search;
        try {
          sessionStorage.setItem(
            RESUME_KEY,
            JSON.stringify({ path, at: Date.now(), options: opts })
          );
        } catch {
          /* private browsing — user just clicks save again after login */
        }
        window.location.href = `/auth/login?return=${encodeURIComponent(path)}`;
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (!res.ok) throw new Error("save failed");
      setPlaylistUrl(data.url ?? null);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  const hasCovers = build?.songs.some((song) => song.coverArtist !== null) ?? false;

  return (
    <div className="relative flex flex-wrap items-center justify-center gap-2">
      {/* Spotify's guidelines want a way back to what we created. Wording is
          v1's, which passed Spotify's app review. The save button stays so a
          tweaked variant can be saved too. */}
      {playlistUrl && (
        <a
          href={playlistUrl}
          target="_blank"
          rel="noreferrer"
          className="mr-1 inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-[#1DB954] hover:text-[#1ed760]"
        >
          View your playlist on Spotify
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5Z" />
            <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z" />
          </svg>
        </a>
      )}
      <button
        onClick={() => save()}
        disabled={state === "saving" || songCount === 0}
        className="rounded-full bg-[#1DB954] px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
      >
        {state === "saving" ? (
          songCount > LONG_PLAYLIST ? "Looking up songs…" : "Saving…"
        ) : (
          <>
            {/* phone width: drop the count so the button fits beside the chips */}
            <span className="sm:hidden">Save as Spotify playlist</span>
            <span className="hidden sm:inline">
              Save {songCount} songs as Spotify playlist
            </span>
          </>
        )}
      </button>
      {build && (
        <SaveOptionsButton
          options={options}
          onChange={setOptions}
          artist={build.artist}
          hasCovers={hasCovers}
          disabled={state === "saving"}
        />
      )}
      {/* only while a long save runs; absolutely placed in the panel's bottom
          padding so it never reflows the row */}
      {state === "saving" && songCount > LONG_PLAYLIST && (
        <span
          role="status"
          className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap text-xs text-zinc-400"
        >
          Long playlist, this may take a minute…
        </span>
      )}
      {state === "error" && (
        <span className="w-full text-center text-sm text-rose-400 sm:w-auto">
          Something went wrong — try again.
        </span>
      )}
    </div>
  );
}

/** Gear toggletip: click to open, tap-outside / Escape closes (TourStats pattern). */
function SaveOptionsButton({
  options,
  onChange,
  artist,
  hasCovers,
  disabled,
}: {
  options: SaveOptions;
  onChange: (next: SaveOptions) => void;
  artist: string;
  hasCovers: boolean;
  disabled: boolean;
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

  const set = (patch: Partial<SaveOptions>) => onChange({ ...options, ...patch });
  const changed =
    options.groupByAlbum || options.preferLive || options.artistCovers;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={open}
        aria-label="Save options"
        title="Save options"
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-50 ${
          open ? "border-zinc-600 bg-zinc-800" : "border-zinc-700"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.416l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.416.587l-.294 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.416-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.416l-1.473-.294A1 1 0 0 1 1 10.68V9.32a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 3.03l1.25.834a6.957 6.957 0 0 1 1.416-.587l.294-1.473ZM13 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            clipRule="evenodd"
          />
        </svg>
        {changed && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#1DB954]" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Save options"
          className="absolute right-0 top-11 z-20 w-72 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left shadow-xl shadow-black/40"
        >
          <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            Save options
          </p>
          <div className="mt-3 space-y-3 text-sm text-zinc-200">
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={options.limitOn}
                onChange={(e) => set({ limitOn: e.target.checked })}
                className="h-4 w-4 accent-[#1DB954]"
              />
              <span className="flex items-center gap-1.5">
                Only the top
                <select
                  value={options.limit}
                  onChange={(e) => set({ limit: Number(e.target.value), limitOn: true })}
                  className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-100"
                  aria-label="Number of songs"
                >
                  {LIMITS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                songs
              </span>
            </label>
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={options.groupByAlbum}
                onChange={(e) => set({ groupByAlbum: e.target.checked })}
                className="h-4 w-4 accent-[#1DB954]"
              />
              Group by album
            </label>
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={options.preferLive}
                onChange={(e) => set({ preferLive: e.target.checked })}
                className="h-4 w-4 accent-[#1DB954]"
              />
              Prefer live versions
            </label>
            {hasCovers && (
              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={options.artistCovers}
                  onChange={(e) => set({ artistCovers: e.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#1DB954]"
                />
                <span>For covers, use {artist}&apos;s version when available</span>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
