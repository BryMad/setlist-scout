/**
 * Dummy "latest shows" for the layout wireframes (/lab/layouts). Setlists are
 * generated from the lab's TRACKS odds so the shows and the Most Likely rail
 * agree with each other: 100% songs appear every night, deep cuts rarely.
 */

import { LAB, TRACKS } from "./data";

export interface LabShow {
  id: string;
  date: string; // ISO YYYY-MM-DD
  venue: string;
  city: string;
  tour: string;
  sets: { label: string | null; songs: { title: string; note?: string }[] }[];
}

const VENUES: [string, string, string][] = [
  ["2026-06-27", "Massey Hall", "Toronto, ON"],
  ["2026-06-25", "MTELUS", "Montréal, QC"],
  ["2026-06-24", "House of Blues", "Boston, MA"],
  ["2026-06-22", "Brooklyn Steel", "Brooklyn, NY"],
  ["2026-06-21", "Brooklyn Steel", "Brooklyn, NY"],
  ["2026-06-19", "The Anthem", "Washington, DC"],
  ["2026-06-18", "Union Transfer", "Philadelphia, PA"],
  ["2026-06-16", "Stage AE", "Pittsburgh, PA"],
];

/** Main-set running order; encores are pulled off the end. */
const ORDER = [
  "Chrome Wilderness",
  "Midnight Arcade",
  "Runaway Frequency",
  "Hollow Coast",
  "Teenage Antenna",
  "Dead Mall Summer",
  "Dreams",
  "Silver Lake, 1974",
  "Vermilion",
  "Paper Suns",
];
const ENCORE = ["Glass Divide", "Static Prayer"];

export const LATEST_SHOWS: LabShow[] = VENUES.map(([date, venue, city], i) => {
  const odds = new Map(TRACKS.map((t) => [t.title, t.pct]));
  // deterministic "did they play it tonight" roll against the song's odds
  const played = (title: string, rank: number) =>
    (i * 37 + rank * 53) % 100 < (odds.get(title) ?? 0);
  const main = ORDER.filter((title, rank) => played(title, rank + 1)).map((title) => ({
    title,
    note: title === "Dreams" ? "Fleetwood Mac cover" : undefined,
  }));
  // one tour debut at the most recent show — the "something just changed" case
  if (i === 0) main.splice(3, 0, { title: "Neon Psalm", note: "live debut" });
  const encore = ENCORE.filter((title, rank) => played(title, rank + 20)).map((title) => ({
    title,
  }));
  return {
    id: `lab-${date}-${i}`,
    date,
    venue,
    city,
    tour: LAB.tour,
    sets: [
      { label: null, songs: main },
      ...(encore.length ? [{ label: "Encore", songs: encore }] : []),
    ],
  };
});

export const fmtDate = (iso: string, withYear = false) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });

export const songCount = (show: LabShow) =>
  show.sets.reduce((n, set) => n + set.songs.length, 0);
