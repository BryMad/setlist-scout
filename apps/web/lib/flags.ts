/** Feature flags (v1 tradition: half-baked features ship dark).
 *  Server-side env vars — set in .env.local for dev, Vercel dashboard for prod. */

/** Festival playlists (§0.1): directory search + lineup discovery + builder.
 *  Default OFF — set ENABLE_FESTIVALS=1 to expose routes, home link, and cron. */
export const festivalsEnabled = (): boolean =>
  process.env.ENABLE_FESTIVALS === "1" || process.env.ENABLE_FESTIVALS === "true";
