import { songKey, type Show } from "./normalize.ts";
import { daysBetween } from "./select.ts";

/**
 * Scoring: turn a selection of shows into a ranked song list.
 *
 * Likelihood is the share of shows the song appeared in, optionally
 * recency-weighted so that when a selection spans tours (the widened last-N
 * route), what the artist plays *now* outweighs what they played last year.
 * A song played twice in one show still counts once — likelihood answers
 * "will I hear it at my show", not "how many times".
 */

export interface ScoreOptions {
  /**
   * Half-life in days for recency weighting; omit/null for equal weighting.
   * Within a single healthy tour equal weighting is right; across a widened
   * multi-tour window ~180 days keeps the current era dominant.
   */
  recencyHalfLifeDays?: number | null;
  /** Reference date for recency weighting. Defaults to the newest show scored. */
  asOf?: string;
}

export interface ScoredSong {
  /** Normalized identity used for grouping (lowercased, whitespace collapsed). */
  key: string;
  /** Display name: the variant most often used on setlist.fm. */
  name: string;
  showsPlayed: number;
  totalShows: number;
  /** 0..1 — (weighted) share of shows featuring this song. */
  likelihood: number;
  /** Distinct tour buckets the song appeared in within this selection. */
  tourSpread: number;
  /** Shows in this selection that this song OPENED (first performed song). */
  openerCount: number;
  /** Shows in this selection where this song appeared in an encore. */
  encoreCount: number;
  /** Shows in this selection that this song CLOSED (last performed song). */
  closerCount: number;
  isCover: boolean;
  coverArtist: string | null;
}

interface SongStats {
  weight: number;
  showsPlayed: number;
  openerCount: number;
  encoreCount: number;
  closerCount: number;
  nameCounts: Map<string, number>;
  coverArtistCounts: Map<string, number>;
  tours: Set<string>;
}

const mostCommon = (counts: Map<string, number>): string | null => {
  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
};

export function scoreSongs(shows: Show[], options: ScoreOptions = {}): ScoredSong[] {
  if (shows.length === 0) return [];

  const halfLife = options.recencyHalfLifeDays ?? null;
  const newestDate = shows.reduce(
    (max, show) => (show.date > max ? show.date : max),
    shows[0]!.date
  );
  const asOf = options.asOf ?? newestDate;
  const weightOf = (show: Show): number =>
    halfLife === null
      ? 1
      : Math.pow(0.5, Math.max(0, daysBetween(show.date, asOf)) / halfLife);

  let totalWeight = 0;
  const stats = new Map<string, SongStats>();

  for (const show of shows) {
    const weight = weightOf(show);
    totalWeight += weight;
    const seenThisShow = new Set<string>();
    const seenEncoreThisShow = new Set<string>();
    const performed = show.songs.filter((song) => !song.isTape);
    const openerKey = performed[0] ? songKey(performed[0].name) : null;
    const closerKey = performed.at(-1) ? songKey(performed.at(-1)!.name) : null;

    for (const song of show.songs) {
      if (song.isTape) continue;
      const key = songKey(song.name);
      if (key.length === 0) continue;

      let entry = stats.get(key);
      if (!entry) {
        entry = {
          weight: 0,
          showsPlayed: 0,
          openerCount: 0,
          encoreCount: 0,
          closerCount: 0,
          nameCounts: new Map(),
          coverArtistCounts: new Map(),
          tours: new Set(),
        };
        stats.set(key, entry);
      }

      entry.nameCounts.set(song.name, (entry.nameCounts.get(song.name) ?? 0) + 1);
      if (song.coverArtist) {
        entry.coverArtistCounts.set(
          song.coverArtist,
          (entry.coverArtistCounts.get(song.coverArtist) ?? 0) + 1
        );
      }

      if (!seenThisShow.has(key)) {
        seenThisShow.add(key);
        entry.weight += weight;
        entry.showsPlayed += 1;
        entry.tours.add(show.tourName ?? "(untoured)");
        if (key === openerKey) entry.openerCount += 1;
        if (key === closerKey) entry.closerCount += 1;
      }
      if (song.isEncore && !seenEncoreThisShow.has(key)) {
        seenEncoreThisShow.add(key);
        entry.encoreCount += 1;
      }
    }
  }

  const scored: ScoredSong[] = [...stats.entries()].map(([key, entry]) => {
    const coverArtist = mostCommon(entry.coverArtistCounts);
    return {
      key,
      name: mostCommon(entry.nameCounts) ?? key,
      showsPlayed: entry.showsPlayed,
      totalShows: shows.length,
      openerCount: entry.openerCount,
      encoreCount: entry.encoreCount,
      closerCount: entry.closerCount,
      likelihood: totalWeight === 0 ? 0 : entry.weight / totalWeight,
      tourSpread: entry.tours.size,
      isCover: coverArtist !== null,
      coverArtist,
    };
  });

  return scored.sort(
    (a, b) =>
      b.likelihood - a.likelihood ||
      b.showsPlayed - a.showsPlayed ||
      a.name.localeCompare(b.name)
  );
}
