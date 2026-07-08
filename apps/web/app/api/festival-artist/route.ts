import { NextRequest, NextResponse } from "next/server";
import { festivalArtist } from "@/lib/data";
import { festivalsEnabled } from "@/lib/flags";

/* One festival lineup slot: resolve → predict → match. Called per artist
   from the festival page so each act is its own invocation + cache entry
   (a 90-act lineup can't fit one serverless request cold). */

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!festivalsEnabled()) return NextResponse.json({ error: "not found" }, { status: 404 });
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  try {
    const data = await festivalArtist(name);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "lookup failed" }, { status: 502 });
  }
}
