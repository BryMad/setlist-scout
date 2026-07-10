/**
 * Every core-pipeline Redis key, in one place — so "does this change need a
 * cache reset?" has a single answer and a single lever.
 *
 * THE RULE — bump a key's version when the change alters what we STORE:
 *   - the shape of the cached value (new/renamed fields),
 *   - or the logic that PRODUCES it (a fixed matcher, a new filter upstream
 *     of the write) — old entries would keep serving the old behavior for
 *     the whole TTL otherwise.
 *
 * NO bump needed when the change only alters how stored data is PROCESSED at
 * request time (new UI grouping, new selector over cached shows): the raw
 * layers cache normalized-but-unprocessed data precisely so processing can
 * evolve for free. Example: the "No tour info" bucket needed no bump — the
 * tourless shows were always in v2:history, just not surfaced.
 *
 * Bumping = rename in place (incarnations3 → incarnations4). Old entries
 * age out via TTL; don't reuse retired names.
 *
 * (Festival keys live in lib/festivals.ts / lib/festival-directory.ts and
 * follow the same rule with their own versions.)
 */
export const cacheKey = {
  /* raw layers — normalized external data, processing-agnostic */
  suggest: (normQuery: string) => `v2:suggest:${normQuery}`,
  recentShows: (mbid: string) => `v2:recent:${mbid}`,
  allShows: (mbid: string) => `v2:history:${mbid}`,
  show: (setlistId: string) => `v2:show:${setlistId}`,

  /* derived layers — versioned; bump when the producing pipeline changes */
  // 3: punctuation-stripping normName (2 cached empty results for "Old 97's")
  incarnations: (normName: string) => `v2:incarnations3:${normName}`,
  // 2: entries carry album names since the canonical-display change
  track: (artistLower: string, songKey: string) =>
    `v2:track2:${artistLower}::${songKey}`,
};
