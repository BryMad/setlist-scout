import Link from "next/link";

export const metadata = { title: "About — SetlistScout" };

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="text-indigo-400 hover:underline"
  >
    {children}
  </a>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="cascade-in mt-10 text-xl font-semibold tracking-tight">{children}</h2>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="cascade-in mt-3 text-sm leading-relaxed text-zinc-300">{children}</p>
);

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="cascade-in text-3xl font-semibold tracking-tight">
        About Setlist Scout
      </h1>
      <P>
        Setlist Scout helps concert-goers prepare for upcoming shows — and relive
        the ones they&apos;ve already seen. Search an artist and see what they&apos;re
        actually playing on tour, ranked by how likely each song is to show up in
        your night&apos;s setlist.
      </P>

      <H2>How it works</H2>
      <ul className="cascade-in mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300 [animation-delay:60ms]">
        <li>
          Search for your favorite artist — suggestions (with artwork) come from{" "}
          <Ext href="https://www.spotify.com">Spotify</Ext>.
        </li>
        <li>
          <strong>Predict my set</strong>: Setlist Scout pulls the artist&apos;s
          recent shows from <Ext href="https://www.setlist.fm">setlist.fm</Ext>,
          tallies every song they&apos;ve played, and ranks the list by likelihood —
          the share of recent shows each song appeared in. Track and album details
          come from Spotify.
        </li>
        <li>
          <strong>Relive a set</strong>: browse an artist&apos;s past tours, see
          what they played across a whole tour, or pick a single night and see that
          exact setlist.
        </li>
        <li>
          Log in with Spotify to save any of these lists as a playlist and start
          cramming for the show. We ask for one permission only — creating public
          playlists on your behalf.
        </li>
      </ul>

      <H2>About the data</H2>
      <P>
        Setlist data on <Ext href="https://www.setlist.fm">setlist.fm</Ext> is
        submitted by fans, so with the vast number of artists out there we
        occasionally run into errors or idiosyncrasies — a band filed under a
        slightly different name, a tour missing a few nights, a cover credited
        oddly. If something looks wrong for an artist you searched, email us at{" "}
        <a
          href="mailto:setlistscout@gmail.com"
          className="text-indigo-400 hover:underline"
        >
          setlistscout@gmail.com
        </a>{" "}
        — let us know what&apos;s not working and we&apos;ll try to fix it. Bug
        reports and feature requests are welcome at the same address (it helps to
        include your browser, the artist you searched, and any error message).
      </P>

      <H2>Privacy</H2>
      <P>
        We only request the minimum Spotify permission needed to create playlists,
        and we don&apos;t keep your data on our servers: your Spotify login lives
        in a secure cookie in your browser and logging out deletes it. No listening
        habits analyzed, no search history stored. The full details are in our{" "}
        <Link href="/legal" className="text-indigo-400 hover:underline">
          Terms &amp; Privacy Policy
        </Link>
        .
      </P>

      <p className="cascade-in mt-10 text-xs leading-relaxed text-zinc-600 [animation-delay:120ms]">
        Setlist Scout is an independent project. It uses the Spotify API but is not
        endorsed, certified, or otherwise approved by Spotify. Setlist and tour
        data powered by setlist.fm.
      </p>
    </main>
  );
}
