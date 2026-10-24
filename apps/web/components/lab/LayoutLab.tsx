"use client";

import { useEffect, useRef, useState } from "react";
import { LAB, TRACKS, type LabTrack } from "./data";
import { LATEST_SHOWS, fmtDate, songCount, type LabShow } from "./layouts-data";

/**
 * Layout wireframes for the artist page rework: latest shows take the center,
 * the Most Likely list compresses into a right rail. Deliberately grayscale —
 * this round judges STRUCTURE, not style. Only the Spotify elements carry
 * color (they're canonical and survive any reskin).
 *
 * The Most Likely row here is the new spec: no band colors, no progress bar,
 * no x/y line — the % is the only number, and hovering (or tapping) it opens
 * a popover that says what it actually means.
 */

type ModeKey = "auto" | "latest" | "last";

const AVG_SET = Math.round(
  LATEST_SHOWS.reduce((n, s) => n + songCount(s), 0) / LATEST_SHOWS.length
);
type VariantKey = "a" | "b" | "c";

const VARIANTS: { key: VariantKey; name: string; note: string }[] = [
  {
    key: "a",
    name: "Index · Show · Odds",
    note: "Three columns: a date index on the left, the picked show in the center, the odds rail on the right. Mobile: two tabs.",
  },
  {
    key: "b",
    name: "Feed + rail",
    note: "The center is a feed of recent shows, newest open, older ones collapsed. Mobile: the top 5 odds sit above the feed and expand to the full list.",
  },
  {
    key: "c",
    name: "Focus + cross-highlight",
    note: "One show at a time with a date strip. Songs played that night get a dot in the rail, and hovering a song in the setlist highlights its row there. Mobile: the rail is a bottom sheet.",
  },
];

/* ── the % popover ────────────────────────────────────────────────────────
   Positioned FIXED from the trigger's rect: the rail scrolls on its own, and
   an absolute popover inside an overflow container gets clipped. */

function basisSentence(t: LabTrack, mode: ModeKey) {
  const range = "Mar 2 – Jun 27, 2026";
  if (mode === "last") {
    const n = 60;
    const plays = Math.min(n, Math.round((t.pct / 100) * n * 0.9 + 2));
    return (
      <>
        Played at <b className="text-zinc-100">{plays} of the last {n} shows</b> (Oct 2025 –
        Jun 2026). Recent nights count more, so {t.pct}% leans toward what they&apos;re
        playing now.
      </>
    );
  }
  const where =
    mode === "latest" ? (
      <>on the {LAB.tour}</>
    ) : (
      <>in their current run, the {LAB.tour}</>
    );
  return t.pct === 100 ? (
    <>
      Played at <b className="text-zinc-100">every one of the last {LAB.shows} shows</b>{" "}
      {where} ({range}).
    </>
  ) : (
    <>
      Played at <b className="text-zinc-100">{t.plays} of the last {LAB.shows} shows</b>{" "}
      {where} ({range}).
    </>
  );
}

function PctTip({ t, mode }: { t: LabTrack; mode: ModeKey }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number; above: boolean } | null>(null);

  const open = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const above = r.bottom + 140 > window.innerHeight;
    setPos({
      top: above ? r.top - 8 : r.bottom + 8,
      right: Math.max(8, window.innerWidth - r.right - 4),
      above,
    });
  };

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [pos]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        onMouseEnter={open}
        onMouseLeave={() => setPos(null)}
        onFocus={open}
        onBlur={() => setPos(null)}
        onClick={() => (pos ? setPos(null) : open())}
        aria-describedby={pos ? `tip-${t.rank}` : undefined}
        className="cursor-help font-mono text-sm font-semibold tabular-nums text-zinc-100 underline decoration-zinc-600 decoration-dotted underline-offset-4 hover:decoration-zinc-300"
      >
        {t.pct}%
      </button>
      {pos && (
        <span
          id={`tip-${t.rank}`}
          role="tooltip"
          className="fixed z-50 w-64 rounded-md border border-zinc-600 bg-zinc-900 p-3 text-left text-xs leading-relaxed text-zinc-300 shadow-2xl"
          style={{
            top: pos.top,
            right: pos.right,
            transform: pos.above ? "translateY(-100%)" : undefined,
          }}
        >
          {basisSentence(t, mode)}
        </span>
      )}
    </>
  );
}

/* ── the new Most Likely row ──────────────────────────────────────────────
   Spotify zone unchanged: 64px art untouched, track / artist / album stacked
   in the platform sans, green OPEN SPOTIFY pill. The cover tag is a bare
   word now — the artist line already names the original artist. */

function LikelyRow({
  t,
  mode,
  playedTonight,
  lit,
}: {
  t: LabTrack;
  mode: ModeKey;
  playedTonight?: boolean;
  lit?: boolean;
}) {
  return (
    <li
      className={`relative grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors ${
        lit ? "bg-zinc-700/60" : ""
      }`}
    >
      {playedTonight !== undefined && (
        <span
          title={playedTonight ? "Played at this show" : "Not played at this show"}
          className={`absolute -left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${
            playedTonight ? "bg-zinc-200" : "bg-transparent"
          }`}
        />
      )}
      {t.matched ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.cover} alt="" className="h-16 w-16 rounded object-cover" />
      ) : (
        <div className="h-16 w-16 rounded bg-zinc-800" />
      )}
      <div className="min-w-0" style={{ fontFamily: "var(--font-geist-sans)" }}>
        <p className="truncate text-sm font-bold" title={t.title}>
          {t.title}
        </p>
        {t.matched && (
          <>
            <p className="truncate text-sm text-zinc-400">{t.artist}</p>
            <p className="truncate text-xs text-zinc-500">{t.album}</p>
          </>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <PctTip t={t} mode={mode} />
        {t.coverOf && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            cover
          </span>
        )}
        {t.matched ? (
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="whitespace-nowrap rounded-full bg-[#1DB954] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white"
          >
            OPEN SPOTIFY
          </a>
        ) : (
          <span className="whitespace-nowrap rounded-full border border-zinc-800 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-zinc-600">
            NO MATCH
          </span>
        )}
      </div>
    </li>
  );
}

/* ── the rail: everything the old HUD panel held, compressed ──────────────
   Mode switch moves IN here — it controls the odds, not the shows. */

function Rail({
  mode,
  setMode,
  limit,
  onShowAll,
  tonight,
  lit,
}: {
  mode: ModeKey;
  setMode: (m: ModeKey) => void;
  limit?: number;
  onShowAll?: () => void;
  tonight?: LabShow;
  lit?: string | null;
}) {
  const [stats, setStats] = useState(false);
  const playedSet = tonight
    ? new Set(tonight.sets.flatMap((s) => s.songs.map((x) => x.title)))
    : null;
  const tracks = limit ? TRACKS.slice(0, limit) : TRACKS;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Most likely tonight</h2>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as ModeKey)}
          className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-300"
          aria-label="Prediction basis"
        >
          <option value="auto">Auto</option>
          <option value="latest">Latest tour</option>
          <option value="last">Last 60 shows</option>
        </select>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
        {mode === "last" ? "60 shows · Oct 2025 – Jun 2026" : `${LAB.shows} shows · Mar 2 – Jun 27`}{" "}
        · ~{AVG_SET} songs a night
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded border border-zinc-600 px-1.5 py-0.5 uppercase tracking-wide text-zinc-300">
          High confidence ?
        </span>
        <button
          onClick={() => setStats((s) => !s)}
          className="rounded border border-zinc-600 px-1.5 py-0.5 uppercase tracking-wide text-zinc-300 hover:border-zinc-400"
        >
          Tour stats {stats ? "▴" : "▾"}
        </button>
      </div>
      {stats && (
        // the old pop-up HUD, folded inline: it's short once it lives in a column
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 rounded-md border border-zinc-800 p-2.5 text-xs">
          <div>
            <dt className="text-zinc-500">Usual opener</dt>
            <dd className="truncate">Chrome Wilderness</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Likely encore</dt>
            <dd className="truncate">Static Prayer</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Different songs</dt>
            <dd>23</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Top album</dt>
            <dd className="truncate">Night Geometry · 34%</dd>
          </div>
        </dl>
      )}
      <button className="mt-3 w-full rounded-full bg-[#1DB954] px-4 py-2 text-sm font-semibold text-white">
        Save as Spotify playlist
      </button>
      {tonight && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-200" /> played {fmtDate(tonight.date)}
        </p>
      )}
      <ol className="mt-2 space-y-0.5">
        {tracks.map((t) => (
          <LikelyRow
            key={t.rank}
            t={t}
            mode={mode}
            playedTonight={playedSet ? playedSet.has(t.title) : undefined}
            lit={lit === t.title}
          />
        ))}
      </ol>
      {limit && onShowAll && (
        <button
          onClick={onShowAll}
          className="mt-2 w-full rounded-md border border-zinc-700 py-2 text-sm text-zinc-300"
        >
          Show all {TRACKS.length} songs
        </button>
      )}
    </div>
  );
}

/* ── center pieces ─────────────────────────────────────────────────────── */

function ShowHeader({ show }: { show: LabShow }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {show.id === LATEST_SHOWS[0]!.id ? "Latest show" : "Recent show"}
      </p>
      <h2 className="mt-0.5 text-2xl font-semibold tracking-tight">{fmtDate(show.date, true)}</h2>
      <p className="text-sm text-zinc-400">
        {show.venue} · {show.city}
      </p>
      <p className="text-xs text-zinc-500">
        {show.tour} · {songCount(show)} songs
      </p>
    </div>
  );
}

function Setlist({
  show,
  mode,
  onHover,
  annotate,
}: {
  show: LabShow;
  mode: ModeKey;
  onHover?: (title: string | null) => void;
  annotate?: boolean;
}) {
  const odds = new Map(TRACKS.map((t) => [t.title, t]));
  let n = 0;
  return (
    <div className="space-y-4">
      {show.sets.map((set, si) => (
        <div key={si}>
          {set.label && (
            <p className="mb-1 border-t border-zinc-800 pt-3 text-xs uppercase tracking-wide text-zinc-500">
              {set.label}
            </p>
          )}
          <ol>
            {set.songs.map((song) => {
              n += 1;
              const t = odds.get(song.title);
              return (
                <li
                  key={song.title}
                  onMouseEnter={() => onHover?.(song.title)}
                  onMouseLeave={() => onHover?.(null)}
                  className="flex items-baseline gap-3 rounded px-2 py-1.5 hover:bg-zinc-800/60"
                >
                  <span className="w-5 shrink-0 text-right font-mono text-xs text-zinc-600">{n}</span>
                  <span className="min-w-0 flex-1">
                    {song.title}
                    {song.note && <span className="ml-2 text-xs text-zinc-500">{song.note}</span>}
                  </span>
                  {annotate &&
                    (t ? (
                      <PctTip t={t} mode={mode} />
                    ) : (
                      <span className="font-mono text-xs text-zinc-500">new</span>
                    ))}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}

/* ── variant A: index · show · odds ───────────────────────────────────── */

function VariantA({ mode, setMode }: { mode: ModeKey; setMode: (m: ModeKey) => void }) {
  const [sel, setSel] = useState(0);
  const [tab, setTab] = useState<"shows" | "odds">("shows");
  const show = LATEST_SHOWS[sel]!;
  return (
    <>
      <div className="mb-4 flex rounded-md border border-zinc-800 p-0.5 text-sm lg:hidden">
        {(["shows", "odds"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 rounded py-1.5 ${tab === k ? "bg-zinc-800 text-zinc-100" : "text-zinc-500"}`}
          >
            {k === "shows" ? "Latest shows" : "Most likely"}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[11rem_minmax(0,1fr)_clamp(360px,27vw,420px)]">
        <nav className={`${tab === "shows" ? "" : "hidden"} lg:block`}>
          <p className="mb-2 hidden text-xs uppercase tracking-wide text-zinc-500 lg:block">Latest shows</p>
          <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-0">
            {LATEST_SHOWS.map((s, i) => (
              <li key={s.id} className="shrink-0">
                <button
                  onClick={() => setSel(i)}
                  className={`w-full rounded-md border px-2.5 py-1.5 text-left lg:border-transparent ${
                    i === sel ? "border-zinc-500 bg-zinc-800" : "border-zinc-800 hover:bg-zinc-900"
                  }`}
                >
                  <span className="block whitespace-nowrap text-sm">{fmtDate(s.date)}</span>
                  <span className="block whitespace-nowrap text-xs text-zinc-500">{s.city}</span>
                </button>
              </li>
            ))}
            <li className="shrink-0">
              <span className="block whitespace-nowrap px-2.5 py-1.5 text-xs text-zinc-500 underline">
                All tours →
              </span>
            </li>
          </ul>
        </nav>
        <section className={`${tab === "shows" ? "" : "hidden"} min-w-0 lg:block`}>
          <ShowHeader show={show} />
          <div className="mt-4">
            <Setlist show={show} mode={mode} />
          </div>
        </section>
        <aside
          className={`${tab === "odds" ? "" : "hidden"} lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:border-l lg:border-zinc-800 lg:pl-4`}
        >
          <Rail mode={mode} setMode={setMode} />
        </aside>
      </div>
    </>
  );
}

/* ── variant B: feed + rail ───────────────────────────────────────────── */

function VariantB({ mode, setMode }: { mode: ModeKey; setMode: (m: ModeKey) => void }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const [allOdds, setAllOdds] = useState(false);
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_clamp(360px,27vw,420px)]">
      {/* mobile: odds first, top 5 */}
      <div className="rounded-lg border border-zinc-800 p-3 lg:hidden">
        <Rail
          mode={mode}
          setMode={setMode}
          limit={allOdds ? undefined : 5}
          onShowAll={() => setAllOdds(true)}
        />
      </div>
      <section className="min-w-0">
        <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Latest shows</p>
        <ul className="space-y-2">
          {LATEST_SHOWS.map((s, i) => {
            const isOpen = open.has(i);
            // collapsed preview = what made this night DIFFERENT (the core
            // songs are the same every night, so listing the opener says nothing)
            const odds = new Map(TRACKS.map((t) => [t.title, t.pct]));
            const unusual = s.sets
              .flatMap((set) => set.songs)
              .filter((x) => (odds.get(x.title) ?? 0) < 50)
              .map((x) => x.title);
            return (
              <li key={s.id} className="rounded-lg border border-zinc-800">
                <button
                  onClick={() => toggle(i)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0">
                    <span className="block font-medium">
                      {fmtDate(s.date)} · {s.city}
                    </span>
                    <span className="block truncate text-sm text-zinc-500">
                      {s.venue}
                      {!isOpen &&
                        (unusual.length ? <> — rarer pulls: {unusual.join(", ")}</> : <> — the standard set</>)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {songCount(s)} songs {isOpen ? "▴" : "▾"}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-zinc-800 px-2 py-3">
                    <Setlist show={s} mode={mode} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm text-zinc-500 underline">Browse all tours →</p>
      </section>
      <aside className="hidden lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:border-l lg:border-zinc-800 lg:pl-4">
        <Rail mode={mode} setMode={setMode} />
      </aside>
    </div>
  );
}

/* ── variant C: focus + cross-highlight ───────────────────────────────── */

function VariantC({ mode, setMode }: { mode: ModeKey; setMode: (m: ModeKey) => void }) {
  const [sel, setSel] = useState(0);
  const [lit, setLit] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const show = LATEST_SHOWS[sel]!;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_clamp(360px,27vw,420px)]">
      <section className="min-w-0 pb-20 lg:pb-0">
        {/* date strip: newest on the left, arrows step through */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSel((s) => Math.min(LATEST_SHOWS.length - 1, s + 1))}
            className="rounded border border-zinc-800 px-2 py-1 text-sm text-zinc-400"
            aria-label="Older show"
          >
            ‹
          </button>
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
            {LATEST_SHOWS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSel(i)}
                className={`shrink-0 rounded border px-2 py-1 text-xs ${
                  i === sel ? "border-zinc-400 bg-zinc-800 text-zinc-100" : "border-zinc-800 text-zinc-500"
                }`}
              >
                {fmtDate(s.date).replace(/^\w+, /, "")}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSel((s) => Math.max(0, s - 1))}
            className="rounded border border-zinc-800 px-2 py-1 text-sm text-zinc-400"
            aria-label="Newer show"
          >
            ›
          </button>
        </div>
        <div className="mt-5">
          <ShowHeader show={show} />
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          % = odds going into this tour&apos;s next show. Hover a song to find it in the rail.
        </p>
        <div className="mt-3">
          <Setlist show={show} mode={mode} onHover={setLit} annotate />
        </div>
      </section>
      <aside className="hidden lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:border-l lg:border-zinc-800 lg:pl-4">
        <Rail mode={mode} setMode={setMode} tonight={show} lit={lit} />
      </aside>

      {/* mobile: rail as a bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        {sheet && (
          <div className="max-h-[75vh] overflow-y-auto rounded-t-xl border-t border-zinc-700 bg-zinc-950 p-4">
            <Rail mode={mode} setMode={setMode} tonight={show} />
          </div>
        )}
        <button
          onClick={() => setSheet((s) => !s)}
          className="flex w-full items-center justify-between border-t border-zinc-700 bg-zinc-900 px-4 py-3 text-sm"
        >
          <span>
            <b>Most likely tonight</b>
            <span className="text-zinc-500"> · {TRACKS.length} songs</span>
          </span>
          <span className="text-zinc-400">{sheet ? "▾" : "▴"}</span>
        </button>
      </div>
    </div>
  );
}

/* ── shell ─────────────────────────────────────────────────────────────── */

export default function LayoutLab() {
  const [variant, setVariant] = useState<VariantKey>("a");
  const [mode, setMode] = useState<ModeKey>("auto");
  const v = VARIANTS.find((x) => x.key === variant)!;
  const props = { mode, setMode };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-dashed border-zinc-700 bg-zinc-900 px-4 py-2 text-xs text-zinc-400">
        <b className="text-zinc-200">Wireframe {variant.toUpperCase()}: {v.name}.</b> {v.note}{" "}
        <span className="text-zinc-500">
          Grayscale on purpose. Judge the structure, not the style.
        </span>
      </div>

      <header className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3 sm:px-6">
        <span className="font-semibold">SetlistScout</span>
        <span className="hidden flex-1 rounded border border-zinc-800 px-3 py-1.5 text-sm text-zinc-600 sm:block">
          Search an artist…
        </span>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">{LAB.artist}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          On the {LAB.tour} · last show {fmtDate(LATEST_SHOWS[0]!.date)} in {LATEST_SHOWS[0]!.city}
        </p>
        <div className="mt-6">
          {variant === "a" && <VariantA {...props} />}
          {variant === "b" && <VariantB {...props} />}
          {variant === "c" && <VariantC {...props} />}
        </div>
      </main>

      <nav className="fixed bottom-16 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-zinc-600 bg-zinc-900/95 px-1.5 py-1 font-mono text-xs shadow-2xl lg:bottom-4">
        {VARIANTS.map((x) => (
          <button
            key={x.key}
            onClick={() => setVariant(x.key)}
            className={`rounded-full px-3 py-1 ${
              x.key === variant ? "bg-zinc-100 text-zinc-900" : "text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {x.key.toUpperCase()}
          </button>
        ))}
      </nav>
    </div>
  );
}
