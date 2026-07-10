import { NextResponse } from "next/server";
import { suggestArtists } from "@/lib/data";

// the setlist.fm fallback path can retry through 429s — outlive the default timeout
export const maxDuration = 30;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ artists: [] });

  const artists = await suggestArtists(query);
  return NextResponse.json({ artists });
}
