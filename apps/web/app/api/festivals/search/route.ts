import { NextRequest, NextResponse } from "next/server";
import { searchFestivals } from "@/lib/festival-directory";
import { festivalsEnabled } from "@/lib/flags";

/* Festival typeahead: live MusicBrainz event search, query-cached in Redis. */

export async function GET(request: NextRequest) {
  if (!festivalsEnabled()) return NextResponse.json({ error: "not found" }, { status: 404 });
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);
  try {
    return NextResponse.json(await searchFestivals(q));
  } catch {
    return NextResponse.json([], { status: 200 }); // typeahead never errors loudly
  }
}
