import { NextResponse, type NextRequest } from "next/server";
import { SpotifyError } from "@setlistscout/clients";
import {
  buildPlaylistUris,
  DEFAULT_PLAYLIST_OPTIONS,
  spotify,
  type PlaylistOptions,
  type PlaylistSong,
} from "@/lib/data";
import { readSession, writeSession, type SpotifySession } from "@/lib/session";

// "all songs" + prefer-live on a deep catalog can mean a few hundred searches
export const maxDuration = 60;

const MAX_TRACKS = 500;

/** Pull known option fields out of an untrusted body; anything odd → default. */
function parseOptions(raw: unknown): PlaylistOptions {
  const o = (raw ?? {}) as Record<string, unknown>;
  const limit = Number(o.limit);
  return {
    limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, MAX_TRACKS) : null,
    groupByAlbum: o.groupByAlbum === true,
    preferLive: o.preferLive === true,
    artistCovers: o.artistCovers === true,
  };
}

function parseSongs(raw: unknown): PlaylistSong[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s): s is Record<string, unknown> =>
        typeof s === "object" && s !== null && typeof s.key === "string" && typeof s.name === "string"
    )
    .slice(0, MAX_TRACKS)
    .map((s) => ({
      key: s.key as string,
      name: s.name as string,
      coverArtist: typeof s.coverArtist === "string" ? s.coverArtist : null,
    }));
}

/**
 * Two request shapes:
 * - { name, description, uris }  — a ready-made track list (festival builder)
 * - { name, description, artist, songs, options } — songs most-likely-first;
 *   the server applies the save options (top N, album order, live takes,
 *   the artist's own covers) and resolves the tracks itself.
 */
export async function POST(request: NextRequest) {
  const session = readSession(request);
  if (!session || !session.refresh) {
    return NextResponse.json({ needsAuth: true }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    uris?: unknown;
    artist?: unknown;
    songs?: unknown;
    options?: unknown;
  };

  let uris: string[];
  const songs = parseSongs(body.songs);
  if (songs.length > 0 && typeof body.artist === "string" && body.artist) {
    uris = await buildPlaylistUris(body.artist, songs, {
      ...DEFAULT_PLAYLIST_OPTIONS,
      ...parseOptions(body.options),
    });
  } else {
    uris = (Array.isArray(body.uris) ? body.uris : [])
      .filter((u): u is string => typeof u === "string")
      .slice(0, MAX_TRACKS);
  }
  if (!body.name || uris.length === 0) {
    return NextResponse.json({ error: "name and tracks are required" }, { status: 400 });
  }

  // refresh the access token if it's expired or about to
  let updated: SpotifySession | null = null;
  let accessToken = session.access;
  if (Date.now() > session.expiresAt - 60_000) {
    const refreshed = await spotify.refreshAccessToken(session.refresh);
    accessToken = refreshed.access_token;
    updated = {
      access: refreshed.access_token,
      refresh: refreshed.refresh_token ?? session.refresh,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
    };
  }

  try {
    const playlist = await spotify.createPlaylist(accessToken, {
      name: body.name,
      description: body.description,
      uris,
    });
    const response = NextResponse.json({ url: playlist.url, count: uris.length });
    if (updated) writeSession(response, updated);
    return response;
  } catch (error) {
    if (error instanceof SpotifyError && error.status === 401) {
      return NextResponse.json({ needsAuth: true }, { status: 401 });
    }
    return NextResponse.json({ error: "playlist creation failed" }, { status: 502 });
  }
}
