import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

/** Deleting the session cookie disconnects Spotify and removes the user's
 *  data from our side — tokens live nowhere else (per the EUA/privacy copy). */
export function POST() {
  const response = NextResponse.json({ ok: true });
  clearSession(response);
  // Spotify re-authorizes already-approved users silently, which makes logout
  // feel fake ("I logged out but saving never asked me anything"). This marker
  // tells the NEXT login to force Spotify's confirmation dialog; the callback
  // clears it, so ordinary logins stay friction-free.
  response.cookies.set("sp_show_dialog", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return response;
}
