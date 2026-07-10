"use client";

import { useEffect, useRef, useState } from "react";

interface SavePlaylistProps {
  playlistName: string;
  description: string;
  uris: string[];
}

/** sessionStorage marker: a save that got interrupted by the OAuth round-trip. */
const RESUME_KEY = "setlistscout:resume-save";

export default function SavePlaylist({ playlistName, description, uris }: SavePlaylistProps) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);

  // Mode/depth switches swap the props but React keeps this component (and its
  // "saved ✓") alive — reset whenever the playlist we'd save is a different one.
  const contentKey = `${playlistName}::${uris.join(",")}`;
  const lastContentKey = useRef(contentKey);
  useEffect(() => {
    if (lastContentKey.current === contentKey) return;
    lastContentKey.current = contentKey;
    setState("idle");
    setPlaylistUrl(null);
  }, [contentKey]);

  // Auto-resume after login: if a save on THIS page was interrupted by the
  // OAuth redirect, finish it now instead of making the user click twice.
  // Requires uris to be complete at mount — true on server-rendered pages;
  // the festival builder mounts with an empty, still-loading list and is
  // deliberately skipped rather than saving a partial playlist.
  useEffect(() => {
    let marker: { path?: string; at?: number } | null = null;
    try {
      const raw = sessionStorage.getItem(RESUME_KEY);
      if (!raw) return;
      sessionStorage.removeItem(RESUME_KEY);
      marker = JSON.parse(raw) as { path?: string; at?: number };
    } catch {
      return;
    }
    const here = window.location.pathname + window.location.search;
    const fresh = Date.now() - (marker?.at ?? 0) < 5 * 60_000;
    if (marker?.path === here && fresh && uris.length > 0) void save();
    // mount-only: the marker is consumed on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playlistName, description, uris }),
      });
      if (res.status === 401) {
        const path = window.location.pathname + window.location.search;
        try {
          sessionStorage.setItem(RESUME_KEY, JSON.stringify({ path, at: Date.now() }));
        } catch {
          /* private browsing — user just clicks save again after login */
        }
        window.location.href = `/auth/login?return=${encodeURIComponent(path)}`;
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (!res.ok) throw new Error("save failed");
      setPlaylistUrl(data.url ?? null);
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-emerald-400">Playlist saved ✓</span>
        {playlistUrl && (
          <a
            href={playlistUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#1DB954] px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Open in Spotify ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={save}
        disabled={state === "saving" || uris.length === 0}
        className="rounded-full bg-[#1DB954] px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
      >
        {state === "saving"
          ? "Saving…"
          : `Save ${uris.length} songs as Spotify playlist`}
      </button>
      {state === "error" && (
        <span className="text-sm text-rose-400">Something went wrong — try again.</span>
      )}
    </div>
  );
}
