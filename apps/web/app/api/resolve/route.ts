import { NextResponse } from "next/server";
import { resolveArtistIncarnations } from "@/lib/data";

/**
 * Resolve a selected artist name to setlist.fm identities. Returns every
 * plausible incarnation (solo, & Crazy Horse, …) with activity stats so the
 * client can navigate directly when unambiguous or offer a choice when not.
 */

// Cold resolve = setlist.fm search + up to 8 serial probes (600ms spacing),
// plus 1.5s+ backoff per 429 retry — Vercel's default timeout kills it mid-flight.
export const maxDuration = 60;

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name")?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const incarnations = await resolveArtistIncarnations(name);
  return NextResponse.json({ incarnations });
}
