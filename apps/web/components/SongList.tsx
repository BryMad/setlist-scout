import type { MatchedTrack } from "@setlistscout/clients";
import type { ScoredSong } from "@setlistscout/engine";

/**
 * The likelihood spectrum, carried over from v1: cool colors are locks, hot
 * colors are deep-cut lottery tickets. Percentages stay as text so color is
 * never the only signal.
 */
const BANDS = [
  { min: 80, bar: "bg-violet-500", text: "text-violet-300", label: "Very likely" },
  { min: 60, bar: "bg-sky-500", text: "text-sky-300", label: "Likely" },
  { min: 40, bar: "bg-yellow-500", text: "text-yellow-300", label: "Possible" },
  { min: 20, bar: "bg-orange-500", text: "text-orange-300", label: "Rare" },
  { min: 0, bar: "bg-rose-600", text: "text-rose-300", label: "Very rare" },
];

const bandFor = (pct: number) =>
  BANDS.find((band) => pct >= band.min) ?? BANDS[BANDS.length - 1]!;

interface SongListProps {
  songs: ScoredSong[];
  matches: Map<string, MatchedTrack | null>;
  /** Hide the likelihood bar/percentage (single-show views are facts, not odds). */
  showLikelihood?: boolean;
}

export default function SongList({ songs, matches, showLikelihood = true }: SongListProps) {
  return (
    <>
      {showLikelihood && (
        <div className="cascade-in mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 [animation-delay:300ms]">
          {BANDS.map((band) => (
            <span key={band.label} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${band.bar}`} />
              {band.label}
            </span>
          ))}
        </div>
      )}
      <ol className={`${showLikelihood ? "mt-3" : "mt-8"} space-y-1`}>
        {songs.map((song, index) => {
          const pct = Math.round(song.likelihood * 100);
          const band = bandFor(pct);
          const match = matches.get(song.key);
          // stagger the first screenful, then the rest arrive together
          const delay = 360 + Math.min(index, 12) * 60;
          return (
            <li
              key={song.key}
              className="group cascade-in row-lit grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-r-lg px-1.5 py-2 sm:grid-cols-[1.75rem_4rem_minmax(0,1fr)_auto] sm:gap-3 sm:px-2"
              style={{ animationDelay: `${delay}ms` }}
            >
              <span className="hidden text-right font-mono text-sm text-zinc-600 sm:block">
                {index + 1}
              </span>

              {/* Spotify content zone: canonical track presentation — artwork
                  unaltered, then track / artist / album stacked, platform
                  sans-serif (mirrors v1's Track component per the guidelines).
                  Mobile drops the index column + tightens gutters so the
                  metadata column clears the guideline minimums (track 23ch /
                  artist 18ch / album 25ch); truncation past that is allowed,
                  full text stays reachable via title attr + the Spotify link. */}
              {match?.albumArt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={match.albumArt}
                  alt=""
                  className="h-16 w-16 rounded object-cover shadow-md"
                />
              ) : (
                <div className="h-16 w-16 rounded bg-zinc-900" />
              )}
              <div className="min-w-0 self-center">
                {match?.url ? (
                  <a
                    href={match.url}
                    target="_blank"
                    rel="noreferrer"
                    title={match.name}
                    className="block truncate text-sm font-bold hover:underline"
                  >
                    {match.name}
                  </a>
                ) : (
                  <span className="block truncate text-sm font-bold" title={song.name}>
                    {song.name}
                  </span>
                )}
                {match && (
                  <>
                    <p className="truncate text-sm text-zinc-400" title={match.artist}>
                      {match.artist}
                    </p>
                    {match.album && (
                      <p className="truncate text-xs text-zinc-500" title={match.album}>
                        {match.album}
                      </p>
                    )}
                  </>
                )}
                {/* cover tag lives OUTSIDE the Spotify metadata stack — their
                    lines stay exactly as provided (lab winner: brand-tinted tag) */}
                {song.isCover && (
                  <p className="mt-1">
                    <span className="rounded border border-indigo-500/40 bg-indigo-500/10 px-1.5 py-0.5 text-[11px] font-medium text-indigo-300">
                      {song.coverArtist ? `COVER · ${song.coverArtist}` : "COVER"}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {/* the likelihood gauge lives out here, not under the track
                    metadata — the Spotify guidelines want title/artist/album
                    centered on the artwork as one clean block (v1 solved this
                    the same way, with an inline circular gauge) */}
                {showLikelihood && (
                  <>
                    <span
                      title={band.label}
                      className={`font-mono text-sm font-semibold ${band.text}`}
                    >
                      {pct}%
                    </span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-sm bg-zinc-800/60">
                      <div
                        className={`bar-seg h-full ${band.bar}`}
                        style={{ width: `${Math.max(pct, 4)}%`, animationDelay: `${delay + 280}ms` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-zinc-600">
                      {song.showsPlayed}/{song.totalShows}
                    </span>
                  </>
                )}
                {/* Spotify attribution: an explicit labeled link per matched
                    track (a Spotify design-guideline requirement, ported from
                    v1's Track button). null = Spotify had no match; undefined =
                    beyond the match budget, never looked up — show nothing. */}
                {match?.url ? (
                  <a
                    href={match.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#1DB954] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white hover:brightness-110"
                  >
                    OPEN SPOTIFY
                  </a>
                ) : match === null ? (
                  <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-zinc-600">
                    NO MATCH
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
