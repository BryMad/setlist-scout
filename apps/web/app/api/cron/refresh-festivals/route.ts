import { NextRequest, NextResponse } from "next/server";
import { festivalsEnabled } from "@/lib/flags";
import { refreshFestivalsFromWiki, refreshInterestedFestivals } from "@/lib/festivals";

/* Weekly refresh (vercel.json cron, Mondays 06:00 UTC), two phases:
   1. Registry festivals (the featured ones) re-parsed from Wikipedia.
   2. Interest-driven: re-discover the most-opened directory festivals only —
      nobody searching for a festival = no calls spent on it. (Directory
      search itself is live-per-query against MusicBrainz; nothing to crawl.)
   Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically when the
   CRON_SECRET env var is set. Manual run: curl with that header. */

export const maxDuration = 300;

const INTERESTED_LIMIT = 15;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!festivalsEnabled()) {
    return NextResponse.json({ skipped: "festivals feature-flagged off (ENABLE_FESTIVALS)" });
  }

  const deadline = Date.now() + 240_000; // headroom under maxDuration
  const registry = await refreshFestivalsFromWiki();
  const interested = await refreshInterestedFestivals(INTERESTED_LIMIT, deadline);

  return NextResponse.json({
    refreshed: new Date().toISOString(),
    registry,
    interested,
  });
}
