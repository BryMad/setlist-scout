"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DirectoryEntry } from "@/lib/festival-directory";

/* Festival typeahead: debounced live search against MusicBrainz (via
   /api/festivals/search — same pattern as the Spotify artist search).
   Picking a result opens the festival page, which discovers the lineup
   from Wikipedia on first visit and records interest for the weekly cron. */

export default function FestivalDirectorySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/festivals/search?q=${encodeURIComponent(q)}`);
        setResults((await res.json()) as DirectoryEntry[]);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const q = query.trim();

  return (
    <section className="mt-10">
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
        Every other festival
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Search any festival worldwide — if its lineup is public, we&apos;ll build the playlist.
      </p>
      <div className="mt-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “hellfest” or “pukkelpop”…"
          className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder-zinc-600 outline-none transition focus:border-indigo-500"
        />
      </div>

      {q.length >= 2 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {results.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/festival/mb-${entry.id}`}
                className="block rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-indigo-600 hover:bg-zinc-900"
              >
                <span className="block truncate text-sm font-medium">{entry.name}</span>
                <span className="block font-mono text-xs text-zinc-500">
                  {entry.begin ?? "dates TBA"}
                  {entry.end && entry.end !== entry.begin ? ` → ${entry.end}` : ""}
                </span>
              </Link>
            </li>
          ))}
          {!searching && results.length === 0 && (
            <li className="text-sm text-zinc-500">No festival matches “{q}”.</li>
          )}
          {searching && results.length === 0 && (
            <li className="font-mono text-xs text-zinc-600">searching…</li>
          )}
        </ul>
      )}
    </section>
  );
}
