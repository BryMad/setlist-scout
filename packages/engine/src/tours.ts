import { isUntaggedShow, type Show } from "./normalize.ts";

/**
 * Tour discovery: aggregate a full show history into a browsable tour list.
 * Ports the old tourExtractor behavior — only shows with actual song data
 * count, junk tour names are dropped, newest tours first. Shows without tour
 * attribution get their own summary (summarizeUntagged) so one-offs stay
 * reachable in the UI instead of vanishing.
 */

export interface TourSummary {
  name: string;
  /** Shows with at least one performed song. */
  showCount: number;
  firstDate: string;
  lastDate: string;
  /** "2023" or "2023–2024", for display. */
  years: string;
}

const yearsLabel = (firstDate: string, lastDate: string): string => {
  const firstYear = firstDate.slice(0, 4);
  const lastYear = lastDate.slice(0, 4);
  return firstYear === lastYear ? firstYear : `${firstYear}–${lastYear}`;
};

export function summarizeTours(shows: Show[]): TourSummary[] {
  const tours = new Map<
    string,
    { name: string; showCount: number; firstDate: string; lastDate: string }
  >();

  for (const show of shows) {
    if (isUntaggedShow(show) || show.songCount === 0) continue;
    const name = show.tourName!.trim();

    const existing = tours.get(name);
    if (!existing) {
      tours.set(name, {
        name,
        showCount: 1,
        firstDate: show.date,
        lastDate: show.date,
      });
    } else {
      existing.showCount += 1;
      if (show.date < existing.firstDate) existing.firstDate = show.date;
      if (show.date > existing.lastDate) existing.lastDate = show.date;
    }
  }

  return [...tours.values()]
    .map((tour) => ({ ...tour, years: yearsLabel(tour.firstDate, tour.lastDate) }))
    .sort(
      (a, b) =>
        (a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : 0) ||
        b.showCount - a.showCount
    );
}

export interface UntaggedSummary {
  showCount: number;
  firstDate: string;
  lastDate: string;
  years: string;
}

/** The catch-all bucket: shows with songs but no tour attribution. Null when empty. */
export function summarizeUntagged(shows: Show[]): UntaggedSummary | null {
  const matched = shows.filter((show) => isUntaggedShow(show) && show.songCount > 0);
  if (matched.length === 0) return null;

  let firstDate = matched[0]!.date;
  let lastDate = matched[0]!.date;
  for (const show of matched) {
    if (show.date < firstDate) firstDate = show.date;
    if (show.date > lastDate) lastDate = show.date;
  }
  return {
    showCount: matched.length,
    firstDate,
    lastDate,
    years: yearsLabel(firstDate, lastDate),
  };
}
