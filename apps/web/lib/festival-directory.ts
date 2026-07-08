import { cacheGet, cacheSet } from "./cache";

/* Festival directory (roadmap §0.1 tier 1): MusicBrainz knows WHICH
   festivals exist (its lineups are empty — see ROADMAP). Instead of bulk
   crawling all ~1,265, we search it LIVE as the user types (same pattern as
   Spotify-driven artist search), cache each query, and look up single
   events by mbid when a festival page opens. Lineups come lazily from
   Wikipedia (festival-wiki.ts discovery) on first visit. */

export interface DirectoryEntry {
  /** MusicBrainz event mbid */
  id: string;
  name: string;
  /** ISO dates when known */
  begin: string | null;
  end: string | null;
}

const UA = "SetlistScout/2.0 (setlistscout@gmail.com)";
const SEARCH_TTL_S = 7 * 24 * 60 * 60;
const ENTRY_TTL_S = 30 * 24 * 60 * 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mb(url: string, tries = 3): Promise<any> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return res.json();
    } catch {
      /* transient TLS resets happen — retry */
    }
    await sleep(1200);
  }
  throw new Error("musicbrainz unreachable");
}

const toEntry = (event: any): DirectoryEntry => ({
  id: event.id,
  name: event.name,
  begin: event["life-span"]?.begin ?? null,
  end: event["life-span"]?.end ?? null,
});

/** Typeahead search over MusicBrainz Festival events. Last term gets a
 *  wildcard so partial typing ("pukkel") matches. Query-cached in Redis. */
export async function searchFestivals(query: string): Promise<DirectoryEntry[]> {
  const clean = query
    .toLowerCase()
    .replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length < 2) return [];

  const cacheKey = `v2:festsearch5:${clean}`;
  const cached = await cacheGet<DirectoryEntry[]>(cacheKey);
  if (cached) return cached;

  const terms = clean.split(" ");
  const lucene = terms
    .map((t, i) => (i === terms.length - 1 ? `event:${t}*` : `event:${t}`))
    .join(" AND ");

  const search = async (extra: string) => {
    const data = await mb(
      `https://musicbrainz.org/ws/2/event?query=${encodeURIComponent(
        `(${lucene}) AND type:Festival${extra}`
      )}&fmt=json&limit=100`
    );
    return ((data.events ?? []) as any[]).map(toEntry);
  };

  // Popular festivals have 100+ per-day/per-stage sub-events that crowd the
  // current edition out of a relevance-ordered page — so query the recent
  // years first, then fill from a general query.
  const year = new Date().getFullYear();
  const recent = await search(` AND event:(${year} OR ${year + 1})`);
  let pool = recent;
  if (recent.length < 12) {
    await sleep(1100); // MB rate limit
    const general = await search("");
    const seen = new Set(recent.map((e) => e.id));
    pool = [...recent, ...general.filter((e) => !seen.has(e.id))];
  }

  // MB splits festivals into per-day/per-stage sub-events ("Pukkelpop 2014,
  // Day 2", "…, Friday: This Tent") — only offer the parent editions.
  const isSubEvent = (name: string) =>
    /,\s*(day|night|weekend|mon|tues|wednes|thurs|fri|satur|sun)/i.test(name) || /:\s/.test(name);

  const today = new Date().toISOString().slice(0, 10);
  const results: DirectoryEntry[] = pool
    .filter((e: DirectoryEntry) => !isSubEvent(e.name))
    // upcoming only — a festival still counts as upcoming until its last day
    .filter((e: DirectoryEntry) => (e.end ?? e.begin ?? "") >= today)
    // soonest first
    .sort((a: DirectoryEntry, b: DirectoryEntry) =>
      (a.begin ?? "9999").localeCompare(b.begin ?? "9999")
    )
    .slice(0, 12);

  await cacheSet(cacheKey, results, SEARCH_TTL_S);
  return results;
}

/** Single event lookup by mbid (the festival page's shell data). */
export async function getDirectoryEntry(mbid: string): Promise<DirectoryEntry | undefined> {
  const cacheKey = `v2:festentry:${mbid}`;
  const cached = await cacheGet<DirectoryEntry>(cacheKey);
  if (cached) return cached;

  const event = await mb(`https://musicbrainz.org/ws/2/event/${mbid}?fmt=json`).catch(() => null);
  if (!event?.id) return undefined;
  const entry = toEntry(event);
  await cacheSet(cacheKey, entry, ENTRY_TTL_S);
  return entry;
}
