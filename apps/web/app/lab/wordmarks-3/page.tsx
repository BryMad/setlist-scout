import Link from "next/link";
import type { ReactNode } from "react";

/* Wordmark lab, round 3 — refining the two finalists.
   Stereo family: single color, three bars, right side only, slow.
   VU-synced family: small 2-3 color palettes; the bars are painted with
   currentColor and Scout inherits the same animated color, so the type and
   the meter are locked to one clock by construction. Everything is slowed
   way down (2.6s-4.4s bounces, 10s-16s color loops). */

interface BarsProps {
  lg: boolean;
  n?: number;
  base?: number; // slowest-bar duration seed, seconds
  step?: number; // per-bar duration increment
  delays?: number[];
  ops?: number[]; // per-bar opacity
  hs?: number[]; // per-bar max height, % of container
  thin?: boolean;
  calm?: boolean; // shallower bounce
}

function Bars({ lg, n = 3, base = 2.8, step = 0.4, delays, ops, hs, thin, calm }: BarsProps) {
  return (
    <span
      className={`inline-flex items-end ${
        lg ? (thin ? "h-7 gap-1" : "h-8 gap-1.5") : thin ? "h-2.5 gap-[2px]" : "h-3 gap-[2px]"
      }`}
    >
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={`${calm ? "wm3-calm" : "wm3-eq"} rounded-[1px] ${
            thin ? (lg ? "w-1" : "w-[2px]") : lg ? "w-1.5" : "w-[3px]"
          }`}
          style={{
            background: "currentColor",
            height: `${hs?.[i] ?? 100}%`,
            opacity: ops?.[i] ?? 1,
            animationDuration: `${base + i * step}s`,
            animationDelay: delays ? `${delays[i]}s` : undefined,
          }}
        />
      ))}
    </span>
  );
}

interface Mark {
  name: string;
  note: string;
  render: (lg: boolean) => ReactNode;
}

const wordmark = (lg: boolean) => `inline-flex items-center font-semibold tracking-tight ${lg ? "gap-4 text-5xl" : "gap-2 text-base"}`;

/* ── Stereo family: single color, three bars, right only ─────────── */

const STEREO: Mark[] = [
  {
    name: "Stereo slow",
    note: "the winner, halved tempo — indigo meter, two-tone text",
    render: (lg) => (
      <span className={wordmark(lg)}>
        Setlist <span className="text-indigo-400">Scout</span>
        <span className="text-indigo-500">
          <Bars lg={lg} ops={[0.5, 0.75, 1]} />
        </span>
      </span>
    ),
  },
  {
    name: "White + meter",
    note: "all-white text; the meter is the only accent on the page",
    render: (lg) => (
      <span className={wordmark(lg)}>
        Setlist Scout
        <span className="text-indigo-500">
          <Bars lg={lg} ops={[0.5, 0.75, 1]} />
        </span>
      </span>
    ),
  },
  {
    name: "Monochrome",
    note: "zero accent — white text, gray meter, pure rhythm",
    render: (lg) => (
      <span className={wordmark(lg)}>
        Setlist Scout
        <span className="text-zinc-500">
          <Bars lg={lg} ops={[0.55, 0.75, 1]} />
        </span>
      </span>
    ),
  },
  {
    name: "Matched",
    note: "Scout and meter the exact same indigo; slowest bounce of the set",
    render: (lg) => (
      <span className={wordmark(lg)}>
        Setlist
        <span className="inline-flex items-center gap-[inherit] text-indigo-400">
          Scout <Bars lg={lg} base={3.6} ops={[0.6, 0.8, 1]} />
        </span>
      </span>
    ),
  },
  {
    name: "Hairline",
    note: "thinner, shorter, shallower — barely moving",
    render: (lg) => (
      <span className={wordmark(lg)}>
        Setlist <span className="text-indigo-400">Scout</span>
        <span className="text-indigo-500">
          <Bars lg={lg} thin calm base={3.4} ops={[0.55, 0.75, 1]} />
        </span>
      </span>
    ),
  },
  {
    name: "Wave",
    note: "same period, phased starts — a gentle traveling swell",
    render: (lg) => (
      <span className={wordmark(lg)}>
        Setlist <span className="text-indigo-400">Scout</span>
        <span className="text-indigo-500">
          <Bars lg={lg} base={3.2} step={0} delays={[0, 0.55, 1.1]} ops={[0.6, 0.8, 1]} />
        </span>
      </span>
    ),
  },
  {
    name: "Ascend",
    note: "stepped bar heights — reads as a meter climbing",
    render: (lg) => (
      <span className={wordmark(lg)}>
        Setlist <span className="text-indigo-400">Scout</span>
        <span className="text-indigo-500">
          <Bars lg={lg} hs={[55, 78, 100]} base={3} ops={[0.6, 0.8, 1]} />
        </span>
      </span>
    ),
  },
  {
    name: "Lowercase",
    note: "casual casing under the same quiet meter",
    render: (lg) => (
      <span className={wordmark(lg)}>
        setlist<span className="text-indigo-400">scout</span>
        <span className="text-indigo-500">
          <Bars lg={lg} ops={[0.5, 0.75, 1]} />
        </span>
      </span>
    ),
  },
];

/* ── VU-synced family: small palettes, Scout follows the meter ───── */

/* Each version wraps Scout + bars in one span whose color is animated by a
   palette class; bars paint with currentColor, so sync is structural. */

const synced = (
  lg: boolean,
  pal: string,
  bars: ReactNode,
  scout = "Scout"
): ReactNode => (
  <span className={wordmark(lg)}>
    Setlist
    <span className={`${pal} inline-flex items-center gap-[inherit]`}>
      {scout} {bars}
    </span>
  </span>
);

const SYNCED: Mark[] = [
  {
    name: "Cool trio",
    note: "indigo → violet → cyan over 12s; five slow bars",
    render: (lg) => synced(lg, "wm3-p1", <Bars lg={lg} n={5} base={2.6} step={0.3} ops={[0.5, 0.65, 0.8, 0.9, 1]} />),
  },
  {
    name: "Two-tone",
    note: "just indigo ↔ cyan, 10s; three bars",
    render: (lg) => synced(lg, "wm3-p2", <Bars lg={lg} base={3} ops={[0.6, 0.8, 1]} />),
  },
  {
    name: "Dusk pair",
    note: "violet ↔ rose, 14s — the Turrell drift grafted onto the meter",
    render: (lg) => synced(lg, "wm3-p3", <Bars lg={lg} n={5} base={2.8} step={0.35} ops={[0.5, 0.65, 0.8, 0.9, 1]} />),
  },
  {
    name: "Blues",
    note: "sky → indigo → blue, 12s; three bars",
    render: (lg) => synced(lg, "wm3-p4", <Bars lg={lg} base={3.2} ops={[0.6, 0.8, 1]} />),
  },
  {
    name: "Ember",
    note: "amber ↔ rose, 13s — the one warm option",
    render: (lg) => synced(lg, "wm3-p5", <Bars lg={lg} base={3} ops={[0.6, 0.8, 1]} />),
  },
  {
    name: "Neutral bloom",
    note: "gray that blooms indigo and settles back, 11s",
    render: (lg) => synced(lg, "wm3-p6", <Bars lg={lg} base={3.2} ops={[0.6, 0.8, 1]} />),
  },
  {
    name: "Ghost",
    note: "indigo ↔ white, 12s — Scout fades between accent and headline",
    render: (lg) => synced(lg, "wm3-p7", <Bars lg={lg} base={3} ops={[0.6, 0.8, 1]} />),
  },
  {
    name: "Pastel drift",
    note: "three muted pastels, 16s — slowest and softest",
    render: (lg) => synced(lg, "wm3-p8", <Bars lg={lg} n={5} base={3.2} step={0.3} ops={[0.5, 0.65, 0.8, 0.9, 1]} thin calm />),
  },
];

const SECTIONS = [
  { title: "Stereo — single color, bars right", intro: "Three bars, one hue, slow.", marks: STEREO },
  { title: "VU synced — Scout follows the meter", intro: "Bars are painted with currentColor and Scout inherits the same animated color — they cannot drift apart.", marks: SYNCED },
];

export default function Wordmarks3Page() {
  return (
    <div data-lab className="min-h-screen bg-zinc-950 text-zinc-100">
      <style>{`
        @keyframes wm3Eq { 0%, 100% { transform: scaleY(.4); } 50% { transform: scaleY(1); } }
        .wm3-eq { transform-origin: bottom; animation: wm3Eq 3s ease-in-out infinite; }
        @keyframes wm3Calm { 0%, 100% { transform: scaleY(.62); } 50% { transform: scaleY(1); } }
        .wm3-calm { transform-origin: bottom; animation: wm3Calm 3.4s ease-in-out infinite; }

        @keyframes wm3P1 { 0%,100% { color: #818cf8; } 40% { color: #a78bfa; } 75% { color: #67e8f9; } }
        .wm3-p1 { animation: wm3P1 12s ease-in-out infinite; }
        @keyframes wm3P2 { 0%,100% { color: #818cf8; } 50% { color: #67e8f9; } }
        .wm3-p2 { animation: wm3P2 10s ease-in-out infinite; }
        @keyframes wm3P3 { 0%,100% { color: #a78bfa; } 50% { color: #fb7185; } }
        .wm3-p3 { animation: wm3P3 14s ease-in-out infinite; }
        @keyframes wm3P4 { 0%,100% { color: #38bdf8; } 45% { color: #818cf8; } 80% { color: #60a5fa; } }
        .wm3-p4 { animation: wm3P4 12s ease-in-out infinite; }
        @keyframes wm3P5 { 0%,100% { color: #f59e0b; } 50% { color: #fb7185; } }
        .wm3-p5 { animation: wm3P5 13s ease-in-out infinite; }
        @keyframes wm3P6 { 0%,100% { color: #a1a1aa; } 50% { color: #818cf8; } }
        .wm3-p6 { animation: wm3P6 11s ease-in-out infinite; }
        @keyframes wm3P7 { 0%,100% { color: #818cf8; } 50% { color: #e4e4e7; } }
        .wm3-p7 { animation: wm3P7 12s ease-in-out infinite; }
        @keyframes wm3P8 { 0%,100% { color: #a5b4fc; } 40% { color: #93c5fd; } 75% { color: #c4b5fd; } }
        .wm3-p8 { animation: wm3P8 16s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .wm3-eq, .wm3-calm,
          .wm3-p1, .wm3-p2, .wm3-p3, .wm3-p4, .wm3-p5, .wm3-p6, .wm3-p7, .wm3-p8 { animation: none; }
        }
      `}</style>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-indigo-400">
          Design lab — wordmarks, round 3
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">The finalists, slowed down</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Stereo and VU-synced, refined per your notes: bars on the right only, everything at half
          tempo or slower, palettes trimmed to two or three colors, and Scout locked to the meter
          color by construction.
        </p>

        {SECTIONS.map((section, si) => (
          <section key={section.title} className="mt-12">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{section.intro}</p>
            <ol className="mt-6 space-y-10">
              {section.marks.map((mark, i) => (
                <li key={mark.name}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-zinc-600">
                      {si === 0 ? "S" : "V"}
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold">{mark.name}</span>
                    <span className="text-sm text-zinc-500">— {mark.note}</span>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
                    <div className="flex h-14 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-6">
                      {mark.render(false)}
                      <div className="w-44 shrink-0 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-600">
                        Search for an artist…
                      </div>
                    </div>
                    <div className="flex items-center bg-zinc-950 px-6 py-12">{mark.render(true)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </main>

      <nav className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950/90 px-2 py-1.5 font-mono text-xs text-zinc-300 shadow-2xl backdrop-blur">
        <Link href="/lab/wordmarks-2" className="rounded-full px-3 py-1 hover:bg-zinc-800">
          ← round 2
        </Link>
        <Link href="/lab" className="rounded-full px-3 py-1 hover:bg-zinc-800">
          lab index
        </Link>
      </nav>
    </div>
  );
}
