import Link from "next/link";
import SavePlaylist from "@/components/SavePlaylist";
import SectionNav from "@/components/SectionNav";
import { ShowPicker } from "@/components/ShowCards";
import SongList from "@/components/SongList";
import { CONFIDENCE_STYLE } from "@/components/confidence";
import { getAllShows, matchTracks, runPrediction } from "@/lib/data";
import type { Show } from "@setlistscout/engine";
import type { MatchedTrack } from "@setlistscout/clients";

// serverless budget: may trigger the full-history crawl when the cache is cold
export const maxDuration = 60;

const PLAYLIST_SIZE = 30;
const MATCH_SIZE = 60;

interface PageProps {
  params: Promise<{ mbid: string; tour: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TourPage({ params, searchParams }: PageProps) {
  const { mbid, tour } = await params;
  const tourName = decodeURIComponent(tour);
  const sp = await searchParams;
  const name = typeof sp.name === "string" ? sp.name : "Artist";
  const view = sp.view === "shows" ? "shows" : "played";
  const query = `?name=${encodeURIComponent(name)}`;

  const shows = await getAllShows(mbid);
  const tourShows = shows.filter(
    (show) => show.tourName === tourName && show.songCount > 0
  );

  const base = `/artist/${mbid}/tour/${encodeURIComponent(tourName)}${query}`;
  const views = [
    { key: "played", label: "What they played", href: base },
    { key: "shows", label: "Pick a show", href: `${base}&view=shows` },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href={`/artist/${mbid}/tours${query}`}
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← All tours
      </Link>
      <h1 className="cascade-in mt-2 text-3xl font-semibold tracking-tight">{name}</h1>
      <p className="cascade-in mt-1 text-lg text-zinc-400 [animation-delay:60ms]">{tourName}</p>
      <SectionNav mbid={mbid} name={name} active="relive" />

      {/* view pills — same control language as Predict's mode pills */}
      <nav className="cascade-in mt-6 flex flex-wrap items-center gap-2 [animation-delay:120ms]">
        {views.map((v) => (
          <Link
            key={v.key}
            href={v.href}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              view === v.key
                ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-300"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      {tourShows.length === 0 ? (
        <p className="mt-10 text-zinc-400">
          No usable setlists recorded for this tour.
        </p>
      ) : view === "shows" ? (
        <>
          <p className="cascade-in mt-6 text-sm leading-relaxed text-zinc-400 [animation-delay:180ms]">
            The exact setlist from one night of this tour — pick it below.
          </p>
          <ShowPicker
            shows={tourShows.map((show) => ({
              id: show.id,
              date: show.date,
              venue: show.venue ?? "",
              city: show.city ?? "",
              tour: show.tourName ?? "",
            }))}
            nameQuery={query}
          />
        </>
      ) : (
        <PlayedView name={name} tourName={tourName} shows={shows} />
      )}
    </main>
  );
}

/** "What they played": the aggregate ranked song list (the original view).
 *  Spotify matching only runs here — the shows view never pays for it. */
async function PlayedView({
  name,
  tourName,
  shows,
}: {
  name: string;
  tourName: string;
  shows: Show[];
}) {
  const prediction = runPrediction(shows, { kind: "named-tour", tourName });
  if (!prediction) {
    return <p className="mt-10 text-zinc-400">No usable setlists recorded for this tour.</p>;
  }

  const matches: Map<string, MatchedTrack | null> = await matchTracks(
    name,
    prediction.songs.slice(0, MATCH_SIZE)
  );
  const playlistUris = prediction.songs
    .slice(0, PLAYLIST_SIZE)
    .map((song) => matches.get(song.key)?.uri)
    .filter((uri): uri is string => Boolean(uri));

  return (
    <>
      <p className="cascade-in mt-6 text-sm leading-relaxed text-zinc-400 [animation-delay:180ms]">
        {/* explicit {" "} — Turbopack's JSX transform drops the space
            between an expression and trailing text that meets a newline */}
        They played about {prediction.typicalSetLength}{" "}
        songs a night on this tour — below is everything they pulled out,
        ranked by how often it came up.
      </p>

      <section className="cascade-in mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 [animation-delay:240ms]">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-md border px-2.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wide ${CONFIDENCE_STYLE[prediction.confidence]}`}
          >
            {prediction.confidence} confidence
          </span>
          <span className="font-mono text-xs text-zinc-500">
            {prediction.showsAnalyzed} shows · {prediction.dateRange.from} →{" "}
            {prediction.dateRange.to}
          </span>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-zinc-300">
          {prediction.explanation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <SavePlaylist
            playlistName={`${name} — ${tourName} setlist`}
            description={`Made with SetlistScout from ${prediction.showsAnalyzed} shows on ${tourName}.`}
            uris={playlistUris}
          />
        </div>
      </section>

      <SongList songs={prediction.songs} matches={matches} />
    </>
  );
}
