import Link from "next/link";
import { notFound } from "next/navigation";
import FestivalBuilder from "@/components/FestivalBuilder";
import { getFestival } from "@/lib/festivals";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FestivalPage({ params }: PageProps) {
  const { slug } = await params;
  const festival = getFestival(slug);
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
        {festival.dates} · {festival.location}
      </p>
      <p className="cascade-in mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 [animation-delay:90ms]">
        We analyze each act&apos;s recent shows and predict what they&apos;ll
        play. Untick anyone you&apos;re skipping, pick how deep the playlist
        should go, and save it.
      </p>

      <FestivalBuilder festival={festival} />
    </main>
  );
}
