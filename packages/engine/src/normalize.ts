import type { Setlist } from "./schema.ts";

/** A song as performed at one show, flattened out of setlist.fm's sets/encores nesting. */
export interface ShowSong {
  name: string;
  /** Walk-on/interlude music from tape — not actually performed, excluded from counts. */
  isTape: boolean;
  /** Played in an encore set (setlist.fm sets.set[].encore). */
  isEncore: boolean;
  isCover: boolean;
  coverArtist: string | null;
}

/** The engine's working unit: one show, normalized. All selection/scoring operates on these. */
export interface Show {
  id: string;
  /** ISO YYYY-MM-DD (setlist.fm uses DD-MM-YYYY). */
  date: string;
  tourName: string | null;
  venue: string | null;
  city: string | null;
  countryCode: string | null;
  /** Freeform note from setlist.fm, e.g. "Played three times for a video shoot." */
  info: string | null;
  songs: ShowSong[];
  /** Performed songs only (tape entries excluded). */
  songCount: number;
}

/** Normalized song identity for grouping (lowercased, whitespace collapsed). */
export const songKey = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

/** Tour labels that mean "no tour" — setlist.fm data uses these literally. */
const JUNK_TOUR_NAME = /^(no tour info|unknown|miscellaneous|various|n\/a)$/i;

/** True when a show has no meaningful tour attribution — one-offs, specials, promos. */
export function isUntaggedShow(show: Show): boolean {
  const name = show.tourName?.trim();
  return !name || JUNK_TOUR_NAME.test(name);
}

/** "12-05-2026" → "2026-05-12" */
export function toIsoDate(eventDate: string): string {
  const [day, month, year] = eventDate.split("-");
  return `${year}-${month}-${day}`;
}

export function toShow(setlist: Setlist): Show {
  const songs: ShowSong[] = setlist.sets.set.flatMap((set) =>
    set.song
      .filter((song) => song.name.trim().length > 0)
      .map((song) => ({
        name: song.name,
        isTape: song.tape ?? false,
        isEncore: set.encore != null,
        isCover: song.cover != null,
        coverArtist: song.cover?.name ?? null,
      }))
  );

  return {
    id: setlist.id,
    date: toIsoDate(setlist.eventDate),
    tourName: setlist.tour?.name ?? null,
    venue: setlist.venue?.name ?? null,
    city: setlist.venue?.city?.name ?? null,
    countryCode: setlist.venue?.city?.country?.code ?? null,
    info: setlist.info ?? null,
    songs,
    songCount: songs.filter((song) => !song.isTape).length,
  };
}
