import SectionNav from "@/components/SectionNav";
import { TourBrowser } from "@/components/ShowCards";
import { getAllShows } from "@/lib/data";
import { summarizeTours } from "@setlistscout/engine";

// serverless budget: a cold full-history crawl of a legacy act takes ~15-25s
export const maxDuration = 60;

interface PageProps {
  params: Promise<{ mbid: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ToursPage({ params, searchParams }: PageProps) {
  const { mbid } = await params;
  const sp = await searchParams;
  const name = typeof sp.name === "string" ? sp.name : "Artist";

  const shows = await getAllShows(mbid);
  const tours = summarizeTours(shows);
  const query = `?name=${encodeURIComponent(name)}`;

  // slim DTO for the client-side filter — never ship the songs
  const lightShows = shows
    .filter((show) => show.songCount > 0)
    .map((show) => ({
      id: show.id,
      date: show.date,
      venue: show.venue ?? "",
      city: show.city ?? "",
      tour: show.tourName ?? "",
    }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="cascade-in text-3xl font-semibold tracking-tight">{name}</h1>
      <SectionNav mbid={mbid} name={name} active="relive" />

      <p className="cascade-in mt-6 text-sm text-zinc-500 [animation-delay:120ms]">
        {tours.length} tours across {lightShows.length} recorded shows. Pick a tour
        to see what got played — or search across every night they&apos;ve logged.
      </p>

      <TourBrowser
        mbid={mbid}
        nameQuery={query}
        tours={tours.map((tour) => ({
          name: tour.name,
          years: tour.years,
          showCount: tour.showCount,
        }))}
        shows={lightShows}
      />

      {tours.length === 0 && (
        <p className="mt-10 text-zinc-400">
          setlist.fm has no tour-tagged shows for this artist.
        </p>
      )}
    </main>
  );
}
