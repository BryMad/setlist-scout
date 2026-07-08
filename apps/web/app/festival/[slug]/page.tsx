import Link from "next/link";
import { notFound } from "next/navigation";
import FestivalBuilder from "@/components/FestivalBuilder";
import { festivalsEnabled } from "@/lib/flags";
import {
  getDirectoryFestival,
  getFestival,
  recordFestivalInterest,
} from "@/lib/festivals";

// directory festivals may run Wikipedia lineup discovery on first visit
export const maxDuration = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FestivalPage({ params }: PageProps) {
  if (!festivalsEnabled()) notFound();
  const { slug } = await params;

  // interest counters steer the weekly refresh toward what people open
  recordFestivalInterest(slug);

  const festival = slug.startsWith("mb-")
    ? await getDirectoryFestival(slug.slice(3))
    : await getFestival(slug);
  if (!festival) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/festivals" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← All festivals
      </Link>
      <h1 className="cascade-in mt-2 text-3xl font-semibold tracking-tight">
        {festival.name} <span className="font-normal text-zinc-500">{festival.year}</span>
      </h1>
      <p className="cascade-in mt-1 font-mono text-sm text-zinc-500 [animation-delay:60ms]">
        {festival.dates}
        {festival.location ? ` · ${festival.location}` : ""}
      </p>

      {festival.lineup.length === 0 ? (
        <section className="cascade-in mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 [animation-delay:120ms]">
          <p className="text-sm leading-relaxed text-zinc-300">
            No public lineup for {festival.name} {festival.year} yet — we checked Wikipedia just
            now. Lineups usually appear shortly after they&apos;re announced; we re-check the
            festivals people are looking at every week, so try back soon.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Already know who you want to see? Search the artist directly and we&apos;ll predict
            their set.
          </p>
        </section>
      ) : (
        <>
          <p className="cascade-in mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 [animation-delay:90ms]">
            We analyze each act&apos;s recent shows and predict what they&apos;ll play. Untick
            anyone you&apos;re skipping, pick how deep the playlist should go, and save it.
          </p>
          <FestivalBuilder festival={festival} />
        </>
      )}
    </main>
  );
}
