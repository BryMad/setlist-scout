"use client";

import Link from "next/link";
import { useState } from "react";

/* Client-side browsing for the Relive half. All show data is already loaded
   server-side, so search here is a pure in-memory filter — no requests. */

export interface LightShow {
  id: string;
  date: string; // ISO YYYY-MM-DD
  venue: string;
  city: string;
  tour: string;
}

/** Every search term must appear somewhere in date/venue/city/tour. */
export function matchShow(show: LightShow, query: string): boolean {
  const haystack = `${show.date} ${show.venue} ${show.city} ${show.tour}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder-zinc-600 outline-none transition focus:border-indigo-500"
    />
  );
}

export function ShowCard({
  show,
  nameQuery,
  showTour = false,
  index = 0,
}: {
  show: LightShow;
  nameQuery: string;
  showTour?: boolean;
  index?: number;
}) {
  return (
    <Link
      href={`/show/${show.id}${nameQuery}`}
      className="cascade-in block rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-indigo-600 hover:bg-zinc-900"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <span className="block text-sm font-medium">{show.date}</span>
      <span className="block truncate text-sm text-zinc-500">
        {[show.venue, show.city].filter(Boolean).join(", ") || "Unknown venue"}
      </span>
      {showTour && show.tour && (
        <span className="block truncate font-mono text-xs text-zinc-600">{show.tour}</span>
      )}
    </Link>
  );
}

const SHOW_CAP = 30;

/** Tours page: tour cards by default; searching filters SHOWS (venue, city,
 *  date, tour), surfacing tours and individual nights that match. */
export function TourBrowser({
  mbid,
  nameQuery,
  tours,
  shows,
}: {
  mbid: string;
  nameQuery: string; // "?name=..." to append to links
  tours: { name: string; years: string; showCount: number }[];
  shows: LightShow[];
}) {
  const [query, setQuery] = useState("");
  const q = query.trim();

  const tourHits = q
    ? tours.filter((t) => matchShow({ id: "", date: "", venue: "", city: "", tour: t.name }, q))
    : tours;
  const showHits = q ? shows.filter((s) => matchShow(s, q)) : [];

  return (
    <>
      <div className="cascade-in mt-6 [animation-delay:180ms]">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Filter by city, venue, date, or tour — try “sydney” or “2019”…"
        />
      </div>

      {!q ? (
        <ul className="mt-6 space-y-2">
          {tours.map((tour, index) => (
            <li
              key={tour.name}
              className="cascade-in"
              style={{ animationDelay: `${240 + Math.min(index, 12) * 60}ms` }}
            >
              <Link
                href={`/artist/${mbid}/tour/${encodeURIComponent(tour.name)}${nameQuery}`}
                className="flex items-baseline justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 hover:border-indigo-600 hover:bg-zinc-900"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{tour.name}</span>
                  <span className="font-mono text-xs text-zinc-500">{tour.years}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-zinc-400">
                  {tour.showCount} show{tour.showCount === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 space-y-8">
          {tourHits.length > 0 && (
            <section>
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
                Tours
              </h2>
              <ul className="mt-3 space-y-2">
                {tourHits.map((tour) => (
                  <li key={tour.name}>
                    <Link
                      href={`/artist/${mbid}/tour/${encodeURIComponent(tour.name)}${nameQuery}`}
                      className="flex items-baseline justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 hover:border-indigo-600 hover:bg-zinc-900"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{tour.name}</span>
                        <span className="font-mono text-xs text-zinc-500">{tour.years}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-zinc-400">
                        {tour.showCount} show{tour.showCount === 1 ? "" : "s"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
              Shows{showHits.length > 0 && ` · ${showHits.length}`}
            </h2>
            {showHits.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                No shows match “{q}” — try a city, venue, year, or tour name.
              </p>
            ) : (
              <>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {showHits.slice(0, SHOW_CAP).map((show, index) => (
                    <li key={show.id}>
                      <ShowCard show={show} nameQuery={nameQuery} showTour index={index} />
                    </li>
                  ))}
                </ul>
                {showHits.length > SHOW_CAP && (
                  <p className="mt-3 font-mono text-xs text-zinc-500">
                    +{showHits.length - SHOW_CAP} more — narrow the search to see them
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

/** Tour page, "Pick a show" view: the tour's shows with the same filter. */
export function ShowPicker({
  shows,
  nameQuery,
}: {
  shows: LightShow[];
  nameQuery: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim();
  const hits = q ? shows.filter((s) => matchShow(s, q)) : shows;

  return (
    <section className="mt-6">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Filter shows by city, venue, or date…"
      />
      <p className="mt-3 font-mono text-xs text-zinc-500">
        {hits.length} of {shows.length} shows
      </p>
      {hits.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Nothing matches “{q}”.</p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {hits.map((show, index) => (
            <li key={show.id}>
              <ShowCard show={show} nameQuery={nameQuery} index={index} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
