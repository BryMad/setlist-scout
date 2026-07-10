import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/session";

/** Login status for the header. The session cookie is HttpOnly, so the
 *  client can't read it directly — this is the one bit it needs. */
export function GET(request: NextRequest) {
  const session = readSession(request);
  return NextResponse.json({ loggedIn: Boolean(session?.refresh) });
}
