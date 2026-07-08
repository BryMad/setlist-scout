#!/usr/bin/env node --experimental-strip-types
/**
 * Refresh festival seed files from Wikipedia (manual/local flow).
 *
 *   node --experimental-strip-types scripts/festival-refresh.mjs [slug…]
 *
 * Writes apps/web/data/festivals/<slug>.json (the repo seed data). The same
 * parser feeds the weekly production cron (/api/cron/refresh-festivals),
 * which writes fresh lineups to Redis without a deploy. Festivals whose
 * lineup isn't on Wikipedia yet (e.g. outside-lands-2026) are hand-curated
 * files not in the registry — this script never touches them.
 */
import { writeFile } from "node:fs/promises";
import { FESTIVAL_REGISTRY, fetchFestivalLineup } from "../apps/web/lib/festival-wiki.ts";

const wanted = process.argv.slice(2);

for (const entry of FESTIVAL_REGISTRY) {
  if (wanted.length && !wanted.includes(entry.slug)) continue;
  try {
    const { acts, source } = await fetchFestivalLineup(entry);
    const festival = {
      slug: entry.slug,
      name: entry.name,
      year: entry.year,
      dates: entry.dates,
      endsOn: entry.endsOn,
      location: entry.location,
      source: `${source} (${new Date().toISOString().slice(0, 10)})`,
      lineup: acts,
    };
    const path = new URL(`../apps/web/data/festivals/${entry.slug}.json`, import.meta.url);
    await writeFile(path, JSON.stringify(festival, null, 2) + "\n");
    const days = [...new Set(acts.map((a) => a.day).filter(Boolean))];
    console.log(
      `✓ ${entry.slug}: ${acts.length} acts` +
        (days.length ? ` (days: ${days.join(", ")})` : "") +
        ` — ${source}`
    );
  } catch (err) {
    console.log(`✗ ${entry.slug}: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 600));
}
