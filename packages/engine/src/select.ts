import { isUntaggedShow, songKey, type Show } from "./normalize.ts";
import { median } from "./quality.ts";

/**
 * Selectors: given quality-filtered shows, pick the subset a prediction is based on.
 * Every user-facing mode is one of these strategies; the auto route-picker
 * (selectAuto) chooses among them based on what the data supports.
 */

export type StrategyKind =
  | "latest-tour"
  | "recent-run"
  | "last-n-shows"
  | "named-tour"
  | "untagged-shows"
  | "single-show";

export interface Selection {
  strategy: StrategyKind;
  /** Newest first. */
  shows: Show[];
  /** Set for tour-based strategies. */
  tourName: string | null;
}

export function sortByDateDesc(shows: Show[]): Show[] {
  return [...shows].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Whole days from one ISO date to another (positive when toIso is later). */
export function daysBetween(fromIso: string, toIso: string): number {
  const ms =
    new Date(`${toIso}T00:00:00Z`).getTime() -
    new Date(`${fromIso}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

export interface RecentRunOptions {
  /**
   * Consecutive shows further apart than this start a new run — unless the
   * same tour name sits on both sides of the gap, which bridges it.
   */
  maxGapDays?: number;
}

export const DEFAULT_RUN_GAP_DAYS = 60;

/**
 * The artist's current era: the most recent contiguous run of shows by
 * date, whether or not setlist.fm has a tour name for it. Tour tagging is
 * crowdsourced and spotty (an active DIY band can have a dozen recent
 * shows with no tag at all), so the tag is treated as a label, not the
 * signal. The run's label is its newest tag; a long gap is bridged only
 * when that label reappears on the far side — arena tours legitimately go
 * quiet between legs. A short stretch of untagged one-offs inside such a
 * gap (a festival, a benefit) rides along; a long untagged stretch is its
 * own era and ends the run.
 */
export function selectRecentRun(
  shows: Show[],
  options: RecentRunOptions = {}
): Selection | null {
  if (shows.length === 0) return null;
  const maxGapDays = options.maxGapDays ?? DEFAULT_RUN_GAP_DAYS;
  const sorted = sortByDateDesc(shows);

  const run: Show[] = [sorted[0]!];
  let i = 1;
  while (i < sorted.length) {
    const newer = run[run.length - 1]!;
    const older = sorted[i]!;
    if (daysBetween(older.date, newer.date) <= maxGapDays) {
      run.push(older);
      i++;
      continue;
    }

    const label = run.find((show) => show.tourName !== null)?.tourName ?? null;
    if (label === null) break;
    let j = i;
    while (
      j < sorted.length &&
      sorted[j]!.tourName === null &&
      daysBetween(sorted[j]!.date, older.date) <= maxGapDays
    ) {
      j++;
    }
    if (j >= sorted.length || sorted[j]!.tourName !== label) break;
    run.push(...sorted.slice(i, j + 1));
    i = j + 1;
  }

  const tourName = run.find((show) => show.tourName !== null)?.tourName ?? null;
  return {
    strategy: tourName === null ? "recent-run" : "latest-tour",
    tourName,
    shows: run,
  };
}

/** All shows from the most recent tour that has any attribution. Null if nothing is toured. */
export function selectLatestTour(shows: Show[]): Selection | null {
  const sorted = sortByDateDesc(shows);
  const anchor = sorted.find((show) => show.tourName !== null);
  if (!anchor) return null;
  return {
    strategy: "latest-tour",
    tourName: anchor.tourName,
    shows: sorted.filter((show) => show.tourName === anchor.tourName),
  };
}

export function selectLastNShows(shows: Show[], n: number): Selection {
  return {
    strategy: "last-n-shows",
    tourName: null,
    shows: sortByDateDesc(shows).slice(0, n),
  };
}

export function selectNamedTour(shows: Show[], tourName: string): Selection | null {
  const matched = sortByDateDesc(shows).filter((show) => show.tourName === tourName);
  if (matched.length === 0) return null;
  return { strategy: "named-tour", tourName, shows: matched };
}

/** Every show with no tour attribution — the "No tour info" bucket. */
export function selectUntaggedShows(shows: Show[]): Selection | null {
  const matched = sortByDateDesc(shows).filter(isUntaggedShow);
  if (matched.length === 0) return null;
  return { strategy: "untagged-shows", tourName: null, shows: matched };
}

export function selectShow(shows: Show[], id: string): Selection | null {
  const show = shows.find((candidate) => candidate.id === id);
  if (!show) return null;
  return { strategy: "single-show", tourName: show.tourName, shows: [show] };
}

/**
 * Share of shows containing the single most-played song (tapes excluded).
 * Rotation gauge: 1.0 means some song plays every night; Phish's no-repeat
 * Sphere run measures 0.11 while every stable-setlist fixture artist —
 * including Metallica's "no repeat weekend" format — sits at 0.94+.
 */
export function peakShowShare(shows: Show[]): number {
  if (shows.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const show of shows) {
    const seenThisShow = new Set<string>();
    for (const song of show.songs) {
      if (song.isTape) continue;
      const key = songKey(song.name);
      if (key.length === 0 || seenThisShow.has(key)) continue;
      seenThisShow.add(key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let max = 0;
  for (const count of counts.values()) if (count > max) max = count;
  return max / shows.length;
}

/**
 * Predictable-coverage score: build the best possible guess-setlist (the
 * top-L songs by show-share, L = median performed songs per night) and
 * measure how much of a typical show it actually covers, 0..1.
 *
 * Unlike peakShowShare this sees the WHOLE distribution: an anchor-song band
 * that always plays the hit but rotates everything else scores low, and
 * Metallica's no-repeat-weekend format lands mid (0.61 on the M72 fixture)
 * instead of a misleading 0.94. Stable-setlist fixtures sit at 0.95+;
 * Phish's Sphere run measures 0.11.
 */
export function coverageShare(shows: Show[]): number {
  if (shows.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const show of shows) {
    const seenThisShow = new Set<string>();
    for (const song of show.songs) {
      if (song.isTape) continue;
      const key = songKey(song.name);
      if (key.length === 0 || seenThisShow.has(key)) continue;
      seenThisShow.add(key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const setLength = Math.round(median(shows.map((show) => show.songCount)));
  if (setLength === 0) return 0;
  const topShares = [...counts.values()]
    .map((count) => count / shows.length)
    .sort((a, b) => b - a)
    .slice(0, setLength);
  // fewer distinct songs than slots = the missing slots are unpredictable (0)
  return topShares.reduce((sum, share) => sum + share, 0) / setLength;
}

// --- auto route-picker ---------------------------------------------------

export type Confidence = "high" | "medium" | "low";

/**
 * Machine-readable notes about why auto chose what it chose.
 * The UI turns these into the "here's how we calculated this" explanation.
 */
export type AutoSignal =
  /** The current run stands on its own. tourName is null for an untagged run. */
  | { kind: "healthy-recent-run"; tourName: string | null; showCount: number }
  /**
   * The current run is thin, but its tour name has never appeared before —
   * a new tour has just started, and even one night of it says more about
   * the next show than any amount of older material. Trusted on its own.
   */
  | { kind: "new-tour"; tourName: string; showCount: number }
  /** Too few shows in the current run to trust alone — widened to last-N. */
  | {
      kind: "thin-recent-run";
      tourName: string | null;
      showCount: number;
      widenedTo: number;
    }
  | { kind: "stale-data"; newestShowDate: string; daysSinceLastShow: number }
  /** Healthy run, but songs rotate so heavily no per-song prediction holds.
   *  widenedTo is null when the run already covers the whole widened window. */
  | {
      kind: "high-rotation";
      tourName: string | null;
      /** coverageShare of the run: predictable fraction of a typical night. */
      coverage: number;
      widenedTo: number | null;
    };

export interface AutoDecision {
  selection: Selection;
  signals: AutoSignal[];
  confidence: Confidence;
}

export interface AutoOptions {
  /** "Today" as an ISO date. Passed in so the engine stays pure/deterministic. */
  asOf: string;
  /** A current run with fewer kept shows than this is too thin to trust alone. */
  minTourSample?: number;
  /** Gap between consecutive shows that ends the current run (see selectRecentRun). */
  runGapDays?: number;
  /** How many shows to widen to when the latest tour is thin or absent. */
  widenTo?: number;
  /** A brand-new tour with fewer shows than this gets low (not medium) confidence. */
  newTourLowBelow?: number;
  /** Newest show older than this caps confidence at medium. */
  staleAfterDays?: number;
  /** Newest show older than this drops confidence to low. */
  dormantAfterDays?: number;
  /**
   * A tour where a best-guess setlist covers less than this fraction of a
   * typical night is a rotation artist; widen the window instead of
   * trusting the tour alone.
   */
  rotationCoverage?: number;
}

export const AUTO_DEFAULTS = {
  minTourSample: 8,
  runGapDays: DEFAULT_RUN_GAP_DAYS,
  widenTo: 60,
  newTourLowBelow: 3,
  staleAfterDays: 540, // ~18 months
  dormantAfterDays: 1095, // ~3 years
  rotationCoverage: 0.5,
};

const CONFIDENCE_RANK: Record<Confidence, number> = { high: 2, medium: 1, low: 0 };

/**
 * True when the run's tour name appears on no show outside the run — the
 * tour is new to this artist's (quality-filtered) history. A second leg of a
 * known tour, or a re-used label, is not new.
 */
function isNewLabel(run: Selection, shows: Show[]): boolean {
  const inRun = new Set(run.shows.map((show) => show.id));
  return !shows.some(
    (show) => !inRun.has(show.id) && show.tourName === run.tourName
  );
}

export function selectAuto(shows: Show[], options: AutoOptions): AutoDecision | null {
  const opts = { ...AUTO_DEFAULTS, ...options };
  if (shows.length === 0) return null;

  const signals: AutoSignal[] = [];
  let confidence: Confidence = "high";
  const cap = (max: Confidence) => {
    if (CONFIDENCE_RANK[max] < CONFIDENCE_RANK[confidence]) confidence = max;
  };

  const run = selectRecentRun(shows, { maxGapDays: opts.runGapDays })!;
  let selection: Selection;

  if (run.shows.length >= opts.minTourSample) {
    const coverage = coverageShare(run.shows);
    if (coverage < opts.rotationCoverage) {
      // Rotation artist: the run is healthy but per-song certainty is low.
      // Widen for more signal — unless the widened window wouldn't reach
      // beyond this run anyway (a long run IS the whole recent history).
      // The run is always a newest-first prefix of the history, so the
      // widened window adds shows exactly when it's longer than the run.
      const widened = selectLastNShows(shows, opts.widenTo);
      const addsOtherShows = widened.shows.length > run.shows.length;
      selection = addsOtherShows ? widened : run;
      signals.push({
        kind: "high-rotation",
        tourName: run.tourName,
        coverage,
        widenedTo: addsOtherShows ? selection.shows.length : null,
      });
      cap("medium");
    } else {
      selection = run;
      signals.push({
        kind: "healthy-recent-run",
        tourName: run.tourName,
        showCount: run.shows.length,
      });
    }
  } else if (run.tourName !== null && isNewLabel(run, shows)) {
    // Night one (or three) of a brand-new tour. Widening would drown the
    // only evidence of the new setlist in the previous tour's material.
    selection = run;
    signals.push({
      kind: "new-tour",
      tourName: run.tourName,
      showCount: run.shows.length,
    });
    cap(run.shows.length < opts.newTourLowBelow ? "low" : "medium");
  } else {
    selection = selectLastNShows(shows, opts.widenTo);
    signals.push({
      kind: "thin-recent-run",
      tourName: run.tourName,
      showCount: run.shows.length,
      widenedTo: selection.shows.length,
    });
    cap("medium");
  }

  const newestShowDate = sortByDateDesc(shows)[0]!.date;
  const daysSinceLastShow = daysBetween(newestShowDate, opts.asOf);
  if (daysSinceLastShow > opts.dormantAfterDays) {
    signals.push({ kind: "stale-data", newestShowDate, daysSinceLastShow });
    cap("low");
  } else if (daysSinceLastShow > opts.staleAfterDays) {
    signals.push({ kind: "stale-data", newestShowDate, daysSinceLastShow });
    cap("medium");
  }

  return { selection, signals, confidence };
}
