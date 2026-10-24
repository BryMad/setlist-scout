import {
  SetlistFmClient,
  SpotifyClient,
  type MatchedTrack,
} from "@setlistscout/clients";
import {
  predict,
  toIsoDate,
  toShow,
  type PredictMode,
  type ScoredSong,
  type Show,
} from "@setlistscout/engine";
import { cacheGet, cacheGetMany, cacheSet } from "./cache";
import { cacheKey } from "./cache-keys";

/**
 * Server-side data layer. Only import from server components / route handlers —
 * this is where the API keys live.
 */

// elevated setlist.fm tier: 16 req/sec, 7 concurrent (matches the old backend)
const client = new SetlistFmClient({
  apiKey: process.env.SETLIST_API_KEY!,
  minRequestGapMs: 63,
  maxConcurrent: 7,
});

export const spotify = new SpotifyClient({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
});

const RECENT_TTL_S = 24 * 60 * 60; // predictions want fresh-ish data
const HISTORY_TTL_S = 7 * 24 * 60 * 60; // full back catalogs move slowly
const SHOW_TTL_S = 7 * 24 * 60 * 60; // a single past show is near-immutable
const TRACK_TTL_S = 90 * 24 * 60 * 60; // song→track mappings basically never change

export interface ArtistSuggestion {
  name: string;
  image: string | null;
  disambiguation: string | null;
  /** Known for setlist.fm-fallback results; Spotify results resolve on selection. */
  mbid: string | null;
}

/**
 * Sources disagree on punctuation — Spotify "Old 97's" vs setlist.fm
 * "Old 97’s" (U+2019), "Panic! at the Disco", "&" vs "and" — so strip it all
 * rather than chase variants. Apostrophes are deleted rather than spaced so
 * "The B-52's" and "The B-52s" agree. "&"/"+" become "and" first: the
 * incarnation separator check below needs them to survive as a word.
 */
const normName = (value: string) => {
  const stripped = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['\u2018\u2019`]/g, "")
    .replace(/[&+]/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  // all-punctuation names ("!!!") strip to nothing — keep them verbatim
  return stripped || value.toLowerCase().trim();
};

/**
 * Spotify drives the suggestion list — its partial-query ranking is what made
 * the old site's dropdown good ("david b" → Bowie, Byrne), and every result
 * has artwork. setlist.fm search only backs it up when Spotify has nothing
 * (tiny/legacy acts). Identity (mbid) is resolved at selection time.
 */
export async function suggestArtists(query: string): Promise<ArtistSuggestion[]> {
  const key = cacheKey.suggest(normName(query));
  const cached = await cacheGet<ArtistSuggestion[]>(key);
  if (cached) return cached;

  const spotifyHits = await spotify.searchArtists(query, 8).catch(() => []);
  let suggestions: ArtistSuggestion[];
  if (spotifyHits.length > 0) {
    suggestions = spotifyHits.map((hit) => ({
      name: hit.name,
      image: hit.imageUrl,
      disambiguation: null,
      mbid: null,
    }));
  } else {
    const fallback = await client
      .searchArtists(query)
      .catch(() => ({ artists: [], total: 0 }));
    suggestions = fallback.artists.slice(0, 8).map((artist) => ({
      name: artist.name,
      image: null,
      disambiguation: artist.disambiguation ?? null,
      mbid: artist.mbid,
    }));
  }

  await cacheSet(key, suggestions, 7 * 24 * 60 * 60);
  return suggestions;
}

export interface ArtistIncarnation {
  mbid: string;
  name: string;
  disambiguation: string | null;
  /** ISO date of their most recent show on setlist.fm. */
  lastShow: string | null;
  /** Career show count in the setlist.fm database. */
  totalShows: number;
}

const isTribute = (disambiguation: string | null | undefined) =>
  /tribute|cover band/i.test(disambiguation ?? "");

/** "neil young and crazy horse" is an incarnation of "neil young"; "pearl jam uk"
 *  is not. Runs on normName output, where "&"/"+" have already become "and". */
const INCARNATION_SEPARATOR = /^\s*(?:and|with|y|feat|featuring)\s+/i;

/**
 * Name → setlist.fm identity, at selection time. Spotify groups an artist's
 * every lineup under one name, but setlist.fm splits them ("Neil Young",
 * "Neil Young & Crazy Horse", "Neil Young + Promise of the Real") — and the
 * touring incarnation is usually the setlist you actually want. So we return
 * ALL plausible incarnations, probed for activity (last show, career show
 * count) so the UI can offer an informed choice when it's genuinely ambiguous.
 */
export async function resolveArtistIncarnations(
  name: string
): Promise<ArtistIncarnation[]> {
  const key = cacheKey.incarnations(normName(name));
  const cached = await cacheGet<ArtistIncarnation[]>(key);
  if (cached) return cached;

  const { artists } = await client.searchArtists(name);
  const target = normName(name);

  const candidates = artists
    .filter((artist) => {
      if (isTribute(artist.disambiguation)) return false;
      const candidate = normName(artist.name);
      if (candidate === target) return true;
      return (
        candidate.startsWith(target) &&
        INCARNATION_SEPARATOR.test(candidate.slice(target.length))
      );
    })
    .slice(0, 8);

  const probed = await Promise.all(
    candidates.map(async (artist): Promise<ArtistIncarnation> => {
      const page = await client.getArtistSetlistsPage(artist.mbid, 1).catch(() => null);
      const newest = page?.setlist[0]?.eventDate ?? null;
      return {
        mbid: artist.mbid,
        name: artist.name,
        disambiguation: artist.disambiguation ?? null,
        lastShow: newest ? toIsoDate(newest) : null,
        totalShows: page?.total ?? 0,
      };
    })
  );

  let incarnations = probed
    .filter((candidate) => candidate.totalShows > 0)
    .sort((a, b) => ((a.lastShow ?? "") > (b.lastShow ?? "") ? -1 : 1))
    .slice(0, 6);

  // Same-name duplicates are DIFFERENT artists (setlist.fm has a 70s band
  // also called "Oasis"). When the evidence is overwhelming — a minnow with
  // <10% of the leader's shows, dormant 10+ years longer — drop it rather
  // than asking the user to tell two identical labels apart. Two genuinely
  // active same-name artists still both surface.
  const exactDupes = incarnations.filter((c) => normName(c.name) === normName(name));
  if (exactDupes.length > 1) {
    const leader = exactDupes.reduce((a, b) => (b.totalShows > a.totalShows ? b : a));
    const year = (iso: string | null) => Number(iso?.slice(0, 4) ?? 0);
    incarnations = incarnations.filter((candidate) => {
      if (candidate === leader || normName(candidate.name) !== normName(name)) return true;
      const minnow = candidate.totalShows < leader.totalShows * 0.1;
      const longDormant = year(leader.lastShow) - year(candidate.lastShow) >= 10;
      return !(minnow && longDormant);
    });
  }

  await cacheSet(key, incarnations, 7 * 24 * 60 * 60);
  return incarnations;
}

/** Last ~100 shows — the Predict half's data. */
export async function getShows(mbid: string): Promise<Show[]> {
  const cached = await cacheGet<Show[]>(cacheKey.recentShows(mbid));
  if (cached) return cached;

  // a cached full history is a superset — serve the slice for free
  const history = await cacheGet<Show[]>(cacheKey.allShows(mbid));
  if (history) {
    const recent = history.slice(0, 100);
    await cacheSet(cacheKey.recentShows(mbid), recent, RECENT_TTL_S);
    return recent;
  }

  const setlists = await client.fetchRecentSetlists(mbid, { maxShows: 100 });
  const shows = setlists.map(toShow);
  await cacheSet(cacheKey.recentShows(mbid), shows, RECENT_TTL_S);
  return shows;
}

/** Full-history crawl — the Relive half's data. */
export async function getAllShows(mbid: string): Promise<Show[]> {
  const cached = await cacheGet<Show[]>(cacheKey.allShows(mbid));
  if (cached) return cached;

  const setlists = await client.fetchAllSetlists(mbid, { maxShows: 3000 });
  const shows = setlists.map(toShow);
  await cacheSet(cacheKey.allShows(mbid), shows, HISTORY_TTL_S);
  await cacheSet(cacheKey.recentShows(mbid), shows.slice(0, 100), RECENT_TTL_S);
  return shows;
}

export async function getSetlistById(setlistId: string): Promise<Show | null> {
  const cached = await cacheGet<Show | null>(cacheKey.show(setlistId));
  if (cached !== undefined) return cached;
  const setlist = await client.getSetlist(setlistId);
  const show = setlist ? toShow(setlist) : null;
  await cacheSet(cacheKey.show(setlistId), show, SHOW_TTL_S);
  return show;
}

export function runPrediction(shows: Show[], mode: PredictMode) {
  return predict(shows, {
    asOf: new Date().toISOString().slice(0, 10),
    mode,
  });
}

type MatchableSong = Pick<ScoredSong, "key" | "name" | "coverArtist">;
// wrapper object so a cached "no match" (null) is distinguishable from a cache miss
type CachedMatch = { m: MatchedTrack | null };

/** Match songs to Spotify tracks; covers are searched under their original artist. */
export async function matchTracks(
  artistName: string,
  songs: MatchableSong[]
): Promise<Map<string, MatchedTrack | null>> {
  const keyFor = (song: MatchableSong) =>
    cacheKey.track((song.coverArtist ?? artistName).toLowerCase(), song.key);

  const cached = await cacheGetMany<CachedMatch>(songs.map(keyFor));

  const results = new Map<string, MatchedTrack | null>();
  const misses: Array<{ key: string; name: string; artist: string }> = [];
  songs.forEach((song, i) => {
    const hit = cached[i];
    if (hit !== undefined) results.set(song.key, hit.m);
    else
      misses.push({
        key: song.key,
        name: song.name,
        artist: song.coverArtist ?? artistName,
      });
  });

  if (misses.length > 0) {
    const fresh = await spotify.matchSongs(misses, { concurrency: 8 });
    await Promise.all(
      songs
        .filter((song) => !results.has(song.key))
        .map(async (song) => {
          if (!fresh.has(song.key)) {
            // lookup errored (rate limit, network) — show nothing this render
            // but do NOT cache it as "no match" for 90 days
            results.set(song.key, null);
            return;
          }
          const match = fresh.get(song.key)!;
          results.set(song.key, match);
          await cacheSet(keyFor(song), { m: match }, TRACK_TTL_S);
        })
    );
  }
  return results;
}

/* ── playlist save options ───────────────────────────────────────── */

export interface PlaylistSong {
  key: string;
  name: string;
  coverArtist: string | null;
}

export interface PlaylistOptions {
  /** Keep only the first N songs (input order = most likely first). null = all. */
  limit: number | null;
  /** Order by album, albums oldest → newest, tracks in album order. */
  groupByAlbum: boolean;
  /** Prefer the performing artist's live recordings; studio when none. */
  preferLive: boolean;
  /** For covers, prefer the performing artist's own recording over the original. */
  artistCovers: boolean;
}

export const DEFAULT_PLAYLIST_OPTIONS: PlaylistOptions = {
  limit: null,
  groupByAlbum: false,
  preferLive: false,
  artistCovers: false,
};

interface MatchAttempt {
  artist: string;
  variant: "" | "live" | "own" | "own-live";
}

/** Most-preferred first; the last attempt is always the default match. */
function attemptsFor(
  song: PlaylistSong,
  performer: string,
  options: PlaylistOptions
): MatchAttempt[] {
  const attempts: MatchAttempt[] = [];
  if (song.coverArtist) {
    if (options.artistCovers) {
      if (options.preferLive) attempts.push({ artist: performer, variant: "own-live" });
      attempts.push({ artist: performer, variant: "own" });
    }
    // live applies to the performer only — the original artist's live take
    // of a song Beck covers is nobody's idea of "prefer live"
    attempts.push({ artist: song.coverArtist, variant: "" });
  } else {
    if (options.preferLive) attempts.push({ artist: performer, variant: "live" });
    attempts.push({ artist: performer, variant: "" });
  }
  return attempts;
}

async function matchAttempt(
  song: PlaylistSong,
  attempt: MatchAttempt
): Promise<MatchedTrack | null | undefined> {
  const key = cacheKey.track(attempt.artist.toLowerCase(), song.key, attempt.variant);
  const hit = await cacheGet<CachedMatch>(key);
  if (hit !== undefined) return hit.m;
  try {
    const match = await spotify.matchSong(
      { key: song.key, name: song.name, artist: attempt.artist },
      {
        live: attempt.variant === "live" || attempt.variant === "own-live",
        requireArtist: attempt.variant !== "",
      }
    );
    await cacheSet(key, { m: match }, TRACK_TTL_S);
    return match;
  } catch {
    return undefined; // errored: try the next attempt, never cache the absence
  }
}

/** Order by album, albums oldest → newest (Spotify dates vary in precision,
 *  but ISO prefixes compare correctly as strings); unmatched-album tracks last. */
function groupByAlbum(tracks: MatchedTrack[]): MatchedTrack[] {
  const groups = new Map<string, MatchedTrack[]>();
  for (const track of tracks) {
    const id = track.album ? `${track.albumReleaseDate ?? ""}::${track.album}` : "";
    groups.set(id, [...(groups.get(id) ?? []), track]);
  }
  const loose = groups.get("") ?? [];
  groups.delete("");
  const albums = [...groups.values()].sort((a, b) => {
    const da = a[0]!.albumReleaseDate ?? "9999";
    const db = b[0]!.albumReleaseDate ?? "9999";
    return da < db ? -1 : da > db ? 1 : 0;
  });
  for (const album of albums) {
    album.sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999));
  }
  return [...albums.flat(), ...loose];
}

/**
 * Songs (most likely first) → playlist URIs under the chosen save options.
 * The default path reads the same cache the page's matching wrote, so a
 * plain save costs no Spotify lookups at all.
 */
export async function buildPlaylistUris(
  performer: string,
  songs: PlaylistSong[],
  options: PlaylistOptions
): Promise<string[]> {
  const chosen = options.limit ? songs.slice(0, options.limit) : songs;
  const tracks: (MatchedTrack | null)[] = new Array(chosen.length).fill(null);

  let next = 0;
  const worker = async () => {
    while (next < chosen.length) {
      const i = next++;
      const song = chosen[i]!;
      for (const attempt of attemptsFor(song, performer, options)) {
        const match = await matchAttempt(song, attempt);
        if (match) {
          tracks[i] = match;
          break;
        }
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  let ordered = tracks.filter((track): track is MatchedTrack => track !== null);
  if (options.groupByAlbum) ordered = groupByAlbum(ordered);
  // two setlist spellings can land on one track — Spotify rejects nothing,
  // it just plays it twice
  return [...new Set(ordered.map((track) => track.uri))];
}

/* ── festival playlists (roadmap §0) ─────────────────────────────── */

export interface FestivalArtistData {
  /** Lineup name as requested (the client's map key). */
  lineupName: string;
  /** Resolved display name (Spotify's casing) when found. */
  name: string;
  image: string | null;
  mbid: string | null;
  status: "ok" | "no-match" | "no-shows";
  typicalSetLength: number | null;
  /** Top predicted songs, likelihood-ordered, pre-matched for playlist uris. */
  songs: Array<{ key: string; title: string; pct: number; uri: string | null }>;
}

const FESTIVAL_ARTIST_TTL_S = 7 * 24 * 60 * 60; // weekly refresh cadence
const FESTIVAL_SONG_BUDGET = 40; // "everything recent" depth pulls the full budget

/**
 * One festival lineup slot, end to end: name → Spotify identity (image,
 * canonical casing) → setlist.fm incarnation (most recently active) →
 * recent shows → auto prediction → top songs matched to Spotify tracks.
 * Every inner step has its own cache; this caches the assembled DTO so a
 * warm festival page costs one Redis read per artist.
 */
export async function festivalArtist(lineupName: string): Promise<FestivalArtistData> {
  // 3: track matcher fix (spelled-out numbers, contained artist names)
  const cacheKey = `v2:festartist3:${normName(lineupName)}`;
  const cached = await cacheGet<FestivalArtistData>(cacheKey);
  if (cached) return cached;

  const miss = (status: "no-match" | "no-shows", extra?: Partial<FestivalArtistData>): FestivalArtistData => ({
    lineupName,
    name: lineupName,
    image: null,
    mbid: null,
    status,
    typicalSetLength: null,
    songs: [],
    ...extra,
  });

  const spotifyHit = (await spotify.searchArtists(lineupName, 1).catch(() => []))[0];
  const displayName = spotifyHit?.name ?? lineupName;
  const image = spotifyHit?.imageUrl ?? null;

  const incarnations = await resolveArtistIncarnations(displayName).catch(() => []);
  const identity = incarnations[0];
  if (!identity) {
    const result = miss("no-match", { name: displayName, image });
    await cacheSet(cacheKey, result, FESTIVAL_ARTIST_TTL_S);
    return result;
  }

  const shows = await getShows(identity.mbid).catch(() => []);
  const prediction = runPrediction(shows, { kind: "auto" });
  if (!prediction || prediction.songs.length === 0) {
    const result = miss("no-shows", { name: displayName, image, mbid: identity.mbid });
    await cacheSet(cacheKey, result, FESTIVAL_ARTIST_TTL_S);
    return result;
  }

  const top = prediction.songs.slice(0, FESTIVAL_SONG_BUDGET);
  const matches = await matchTracks(displayName, top);
  const result: FestivalArtistData = {
    lineupName,
    name: displayName,
    image,
    mbid: identity.mbid,
    status: "ok",
    typicalSetLength: prediction.typicalSetLength,
    songs: top.map((song) => ({
      key: song.key,
      title: song.name,
      pct: Math.round(song.likelihood * 100),
      uri: matches.get(song.key)?.uri ?? null,
    })),
  };
  await cacheSet(cacheKey, result, FESTIVAL_ARTIST_TTL_S);
  return result;
}
