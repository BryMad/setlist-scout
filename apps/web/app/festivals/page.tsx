import Link from "next/link";
import { notFound } from "next/navigation";
import FestivalDirectorySearch from "@/components/FestivalDirectorySearch";
import { festivalsEnabled } from "@/lib/flags";
import { getFestivals } from "@/lib/festivals";

export const metadata = { title: "Festival playlists — SetlistScout" };

export default async function FestivalsPage() {
  if (!festivalsEnabled()) notFound();
  const festivals = await getFestivals();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="cascade-in text-3xl font-semibold tracking-tight">Festival playlists</h1>
      <p className="cascade-in mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 [animation-delay:60ms]">
        Pick a festival and we&apos;ll predict what every act on the lineup is
        likely to play, then build the whole thing into one Spotify playlist —
        from a top-3-per-artist taster to everything from their recent shows.
      </p>

      <ul className="mt-8 space-y-2">
        {festivals.map((festival, index) => (
          <li
            key={festival.slug}
            className="cascade-in"
            style={{ animationDelay: `${120 + index * 60}ms` }}
          >
            <Link
              href={`/festival/${festival.slug}`}
              className="flex items-baseline justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 hover:border-indigo-600 hover:bg-zinc-900"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">
                  {festival.name}{" "}
                  <span className="font-normal text-zinc-500">{festival.year}</span>
                </span>
                <span className="font-mono text-xs text-zinc-500">
                  {festival.dates} · {festival.location}
                </span>
              </span>
              <span className="shrink-0 font-mono text-xs text-zinc-400">
                {festival.lineup.length} acts
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <FestivalDirectorySearch />

      <p className="mt-8 text-xs leading-relaxed text-zinc-600">
        Lineups are sourced from public announcements and may not be complete.
        Acts without enough recent setlist data are skipped automatically.
      </p>
    </main>
  );
}
