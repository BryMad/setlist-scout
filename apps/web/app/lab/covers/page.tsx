/**
 * Lab: how to say "this is a cover" on mobile without breaking Spotify's
 * metadata rules (track/artist/album shown as provided, 23/18/25-char
 * minimums, artwork unaltered). Every variant uses the shipped two-row
 * mobile layout; only the cover treatment changes. Dummy data.
 */

interface DummyRow {
  n: number;
  title: string;
  artist: string;
  album: string;
  pct: number;
  plays: string;
  cover?: string | null; // undefined = not a cover; null = cover, artist unknown
  art: string; // css background for the fake artwork
}

const ROWS: DummyRow[] = [
  {
    n: 1,
    title: "Everlong",
    artist: "Foo Fighters",
    album: "The Colour and the Shape",
    pct: 96,
    plays: "58/60",
    art: "linear-gradient(135deg,#7c3aed,#312e81)",
  },
  {
    n: 2,
    title: "The Ghost of Tom Joad",
    artist: "Rage Against the Machine",
    album: "Renegades",
    pct: 74,
    plays: "44/60",
    cover: "Bruce Springsteen",
    art: "linear-gradient(135deg,#b45309,#7f1d1d)",
  },
  {
    n: 3,
    title: "Take On Me",
    artist: "a-ha",
    album: "Hunting High and Low",
    pct: 41,
    plays: "25/60",
    cover: null,
    art: "linear-gradient(135deg,#0ea5e9,#1e3a8a)",
  },
  {
    n: 4,
    title: "Somebody That I Used to Know",
    artist: "Gotye",
    album: "Making Mirrors",
    pct: 18,
    plays: "11/60",
    cover: "Gotye",
    art: "linear-gradient(135deg,#10b981,#064e3b)",
  },
];

type Variant = {
  key: string;
  name: string;
  note: string;
  /** renders the cover treatment inside the metadata column (below album) */
  belowMeta?: (cover: string | null) => React.ReactNode;
  /** renders the cover treatment at the left of the bottom controls row */
  inControls?: (cover: string | null) => React.ReactNode;
  /** renders under the artwork square */
  underArt?: (cover: string | null) => React.ReactNode;
};

const coverText = (cover: string | null) => (cover ? `${cover} cover` : "Cover");

const VARIANTS: Variant[] = [
  {
    key: "chip",
    name: "Chip under album",
    note: "What ships today: a quiet zinc chip after the metadata stack.",
    belowMeta: (cover) => (
      <p className="mt-1">
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
          {coverText(cover)}
        </span>
      </p>
    ),
  },
  {
    key: "byline",
    name: "Byline",
    note: "No chrome at all — an italic credit line, like liner notes.",
    belowMeta: (cover) => (
      <p className="mt-0.5 text-xs italic text-zinc-500">
        {cover ? `originally by ${cover}` : "cover"}
      </p>
    ),
  },
  {
    key: "indigo",
    name: "Brand-tinted tag",
    note: "Same placement as the chip, but indigo so it reads as a feature, not metadata.",
    belowMeta: (cover) => (
      <p className="mt-1">
        <span className="rounded border border-indigo-500/40 bg-indigo-500/10 px-1.5 py-0.5 text-[11px] font-medium text-indigo-300">
          {cover ? `COVER · ${cover}` : "COVER"}
        </span>
      </p>
    ),
  },
  {
    key: "controls",
    name: "In the controls row",
    note: "Metadata stack stays pure; the cover credit sits with the gauge on the bottom row.",
    inControls: (cover) => (
      <span className="mr-1 flex min-w-0 items-center gap-1 text-xs text-zinc-500">
        <svg className="shrink-0" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M2 6a4 4 0 0 1 7-2.5M10 6a4 4 0 0 1-7 2.5" />
          <path d="M9 1v2.5H6.5M3 11V8.5h2.5" />
        </svg>
        <span className="max-w-24 truncate whitespace-nowrap">{coverText(cover)}</span>
      </span>
    ),
  },
  {
    key: "underart",
    name: "Tag under artwork",
    note: "Hangs off the art square (never ON it — artwork must stay unaltered).",
    underArt: () => (
      <span className="mt-1 block w-16 truncate text-center text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        cover
      </span>
    ),
    belowMeta: (cover) =>
      cover ? (
        <p className="mt-0.5 text-xs text-zinc-500">originally by {cover}</p>
      ) : null,
  },
];

function Row({ row, variant }: { row: DummyRow; variant: Variant }) {
  const isCover = row.cover !== undefined;
  return (
    <li className="grid grid-cols-[4rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-2 py-2">
      <div>
        <div className="h-16 w-16 rounded shadow-md" style={{ background: row.art }} />
        {isCover && variant.underArt?.(row.cover ?? null)}
      </div>
      <div className="min-w-0 self-center">
        <span className="block truncate text-sm font-bold text-zinc-100">{row.title}</span>
        <p className="truncate text-sm text-zinc-400">{row.artist}</p>
        <p className="truncate text-xs text-zinc-500">{row.album}</p>
        {isCover && variant.belowMeta?.(row.cover ?? null)}
      </div>
      <div className="col-span-2 flex flex-row items-center gap-3">
        {isCover && variant.inControls?.(row.cover ?? null)}
        <span className="font-mono text-sm font-semibold text-violet-300">{row.pct}%</span>
        <div className="h-1.5 w-16 overflow-hidden rounded-sm bg-zinc-800/60">
          <div className="h-full bg-violet-500" style={{ width: `${row.pct}%` }} />
        </div>
        <span className="font-mono text-[10px] text-zinc-600">{row.plays}</span>
        <span className="ml-auto rounded-full bg-[#1DB954] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white">
          OPEN SPOTIFY
        </span>
      </div>
    </li>
  );
}

export default function CoversLabPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-indigo-400">Design lab</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Saying &quot;cover&quot; on mobile</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Five treatments in a 375px frame. Constraints: Spotify&apos;s track / artist /
        album lines stay exactly as provided (23/18/25-char minimums, no crowding),
        artwork untouched, everything still links out. Row 2 is a cover with a known
        original artist, row 3 a cover with no artist recorded, row 4 a long-title cover.
      </p>

      <div className="mt-10 flex flex-wrap gap-8">
        {VARIANTS.map((variant) => (
          <section key={variant.key}>
            <h2 className="font-semibold">{variant.name}</h2>
            <p className="mt-1 max-w-[375px] text-xs text-zinc-500">{variant.note}</p>
            <div className="mt-3 w-[375px] rounded-2xl border border-zinc-800 bg-zinc-950 p-2">
              <ol className="divide-y divide-zinc-900">
                {ROWS.map((row) => (
                  <Row key={row.n} row={row} variant={variant} />
                ))}
              </ol>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
