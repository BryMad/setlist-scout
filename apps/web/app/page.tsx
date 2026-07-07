import Link from "next/link";
import ArtistSearch from "@/components/ArtistSearch";
import Wordmark from "@/components/Wordmark";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-6 pt-[22vh]">
      <h1>
        <Wordmark size="hero" />
      </h1>
      <p className="mt-3 text-center text-zinc-400">
        Know the setlist before the show.
      </p>

      <div className="mt-10 w-full">
        <ArtistSearch variant="hero" autoFocus />
      </div>

      <Link
        href="/festivals"
        className="cascade-in mt-8 text-sm text-zinc-500 transition hover:text-indigo-300 [animation-delay:240ms]"
      >
        Going to a festival? Build a lineup playlist →
      </Link>
    </main>
  );
}
