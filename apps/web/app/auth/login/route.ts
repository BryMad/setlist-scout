import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { spotify } from "@/lib/data";
import { redirectUriFor } from "@/lib/session";

export function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("return") ?? "/";
  const state = randomUUID();

  const response = NextResponse.redirect(
    spotify.buildAuthorizeUrl({
      redirectUri: redirectUriFor(request),
      state,
      // set by /auth/logout: the first login after an explicit logout shows
      // Spotify's confirmation screen instead of bouncing back invisibly
      showDialog: request.cookies.get("sp_show_dialog")?.value === "1",
    })
  );
  response.cookies.set("sp_oauth", JSON.stringify({ state, returnTo }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
