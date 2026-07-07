import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/* Wordmark lab, round 5 — the staircase moves to the LEFT, ascending into
   the words so the ramp leads your eye to the name. Same hover-to-play
   random bounce as round 4. New: sandwich colorings (color / white / color)
   and two hover-shift options where waking the meter also turns the color —
   a state change on interaction, not ambient cycling. */

const DURS = [0.9, 1.25, 0.75, 1.4, 1.05];
const DELAYS = [0, 0.2, 0.45, 0.1, 0.3];
const PATTERNS = ["wm5-a", "wm5-b", "wm5-c", "wm5-a", "wm5-b"];
const STAIR = [0.25, 0.4, 0.55, 0.75, 1]; // ascending toward the words

interface BarsProps {
  lg: boolean;
  colors?: string[]; // omit to paint with currentColor (for hover-shift)
}

function Bars({ lg, colors }: BarsProps) {
  return (
    <span className={`inline-flex items-end ${lg ? "h-9 gap-1.5" : "h-3.5 gap-[2px]"}`}>
      {STAIR.map((s, i) => (
        <span
          key={i}
          className={`wm5-bar ${PATTERNS[i]} rounded-[1px] ${lg ? "w-1.5" : "w-[3px]"}`}
          style={
            {
              background: colors ? colors[i] : "currentColor",
              height: "100%",
              opacity: 0.55 + i * 0.11,
              transform: `scaleY(${s})`,
              "--d": `${DURS[i]}s`,
              "--dl": `${DELAYS[i]}s`,
            } as CSSProperties
          }
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

const wordmark = (lg: boolean) =>
  `wm5 group inline-flex cursor-default items-center font-semibold tracking-tight ${lg ? "gap-4 text-5xl" : "gap-2 text-base"}`;

const INDIGO = ["#6366f1", "#6366f1", "#6366f1", "#6366f1", "#6366f1"];
const VIOLET_DEPTH = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c4b5fd"];

const MARKS: Mark[] = [
  {
    name: "Sandwich",
    note: "the ask — color · white · color, staircase climbing into the name",
    render: (lg) => (
      <span className={wordmark(lg)}>
        <Bars lg={lg} colors={INDIGO} />
        Setlist <span className="text-indigo-400">Scout</span>
      </span>
    ),
  },
  {
    name: "Sandwich · violet depth",
    note: "the stair carries the dark→pale purple ramp; Scout matches the palest step",
    render: (lg) => (
      <span className={wordmark(lg)}>
        <Bars lg={lg} colors={VIOLET_DEPTH} />
        Setlist <span className="text-[#c4b5fd]">Scout</span>
      </span>
    ),
  },
  {
    name: "Both lit",
    note: "Setlist colored too — two indigo steps apart, meter deeper still",
    render: (lg) => (
      <span className={wordmark(lg)}>
        <Bars lg={lg} colors={INDIGO} />
        <span className="text-indigo-300">Setlist</span>{" "}
        <span className="text-indigo-400">Scout</span>
      </span>
    ),
  },
  {
    name: "Reverse",
    note: "color weighted left — meter + Setlist indigo, Scout finishes white",
    render: (lg) => (
      <span className={wordmark(lg)}>
        <Bars lg={lg} colors={INDIGO} />
        <span className="text-indigo-400">Setlist</span> Scout
      </span>
    ),
  },
  {
    name: "Monolith",
    note: "no white anywhere — three shades of the same family",
    render: (lg) => (
      <span className={wordmark(lg)}>
        <Bars lg={lg} colors={INDIGO} />
        <span className="text-indigo-300">Setlist</span>{" "}
        <span className="text-[#a5b4fc]">Scout</span>
      </span>
    ),
  },
  {
    name: "Hover shift · cyan",
    note: "waking the meter turns bars + Scout from indigo to cyan; Setlist stays white",
    render: (lg) => (
      <span className={wordmark(lg)}>
        <span className="wm5-shift-cyan inline-flex items-center gap-[inherit]">
          <Bars lg={lg} />
        </span>
        Setlist{" "}
        <span className="wm5-shift-cyan">Scout</span>
      </span>
    ),
  },
  {
    name: "Hover shift · fuchsia",
    note: "same trick, warmer turn — and Setlist blushes faintly too",
    render: (lg) => (
      <span className={wordmark(lg)}>
        <span className="wm5-shift-pink inline-flex items-center gap-[inherit]">
          <Bars lg={lg} />
        </span>
        <span className="transition-colors duration-500 group-hover:text-[#fce7f3]">Setlist</span>{" "}
        <span className="wm5-shift-pink">Scout</span>
      </span>
    ),
  },
];

export default function Wordmarks5Page() {
  return (
    <div data-lab className="min-h-screen bg-zinc-950 text-zinc-100">
      <style>{`
        @keyframes wm5A { 0% { transform: scaleY(.3); } 22% { transform: scaleY(.95); } 40% { transform: scaleY(.45); } 62% { transform: scaleY(1); } 80% { transform: scaleY(.35); } 100% { transform: scaleY(.3); } }
        @keyframes wm5B { 0% { transform: scaleY(.55); } 28% { transform: scaleY(.25); } 50% { transform: scaleY(.9); } 72% { transform: scaleY(.4); } 100% { transform: scaleY(.55); } }
        @keyframes wm5C { 0% { transform: scaleY(.7); } 25% { transform: scaleY(.4); } 48% { transform: scaleY(1); } 70% { transform: scaleY(.3); } 88% { transform: scaleY(.8); } 100% { transform: scaleY(.7); } }

        .wm5-bar { transform-origin: bottom; transition: transform .3s ease; }
        .wm5:hover .wm5-bar {
          animation-duration: var(--d);
          animation-delay: var(--dl);
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .wm5:hover .wm5-a { animation-name: wm5A; }
        .wm5:hover .wm5-b { animation-name: wm5B; }
        .wm5:hover .wm5-c { animation-name: wm5C; }

        /* hover shift: bars use currentColor, Scout shares the class — one
           transition moves them together */
        .wm5-shift-cyan { color: #818cf8; transition: color .5s ease; }
        .wm5:hover .wm5-shift-cyan { color: #67e8f9; }
        .wm5-shift-pink { color: #818cf8; transition: color .5s ease; }
        .wm5:hover .wm5-shift-pink { color: #f472b6; }

        @media (prefers-reduced-motion: reduce) {
          .wm5:hover .wm5-bar { animation: none; }
        }
      `}</style>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-indigo-400">
          Design lab — wordmarks, round 5
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Staircase left</h1>
        <p className="mt-2 text-sm text-zinc-400">
          The frozen staircase now sits on the left, climbing into the name. Hover anywhere on the
          mark to press play (same random bounce as round 4). The last two also turn color while
          you hover — a state change, not a cycle; everything is still at rest.
        </p>

        <ol className="mt-10 space-y-10">
          {MARKS.map((mark, i) => (
            <li key={mark.name}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-zinc-600">{String(i + 1).padStart(2, "0")}</span>
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
      </main>

      <nav className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950/90 px-2 py-1.5 font-mono text-xs text-zinc-300 shadow-2xl backdrop-blur">
        <Link href="/lab/wordmarks-4" className="rounded-full px-3 py-1 hover:bg-zinc-800">
          ← round 4
        </Link>
        <Link href="/lab" className="rounded-full px-3 py-1 hover:bg-zinc-800">
          lab index
        </Link>
      </nav>
    </div>
  );
}
