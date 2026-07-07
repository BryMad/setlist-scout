import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/* Wordmark lab, round 4 — hover-to-play.
   At rest the mark is quiet; hover wakes the meter with the ORIGINAL bouncy
   energy. Randomness by construction: three different bounce patterns
   assigned across the bars at non-harmonic speeds (0.75s-1.4s), so they can
   never fall into a wave. No color animation anywhere — the spectrum
   versions are static ramps across the five bars. */

const DURS = [0.9, 1.25, 0.75, 1.4, 1.05]; // non-harmonic — never syncs
const DELAYS = [0, 0.2, 0.45, 0.1, 0.3];
const PATTERNS = ["wm4-a", "wm4-b", "wm4-c", "wm4-a", "wm4-b"];

interface BarsProps {
  lg: boolean;
  colors: string[]; // 5 entries — all-purple or a static ramp
  rest?: "stub" | "hidden" | "stair";
  ops?: number[];
}

function Bars({ lg, colors, rest = "stub", ops }: BarsProps) {
  const restScale = (i: number) =>
    rest === "stair" ? [0.25, 0.4, 0.55, 0.75, 1][i]! : rest === "hidden" ? 0.15 : 0.18;
  const restOpacity = rest === "hidden" ? 0 : rest === "stair" ? 0.85 : 0.5;
  return (
    <span className={`inline-flex items-end ${lg ? "h-9 gap-1.5" : "h-3.5 gap-[2px]"}`}>
      {colors.map((c, i) => (
        <span
          key={i}
          className={`wm4-bar ${PATTERNS[i]} rounded-[1px] ${lg ? "w-1.5" : "w-[3px]"}`}
          style={
            {
              background: c,
              height: "100%",
              opacity: (ops?.[i] ?? 1) * restOpacity,
              transform: `scaleY(${restScale(i)})`,
              "--d": `${DURS[i]}s`,
              "--dl": `${DELAYS[i]}s`,
              "--o": ops?.[i] ?? 1,
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
  `wm4 group inline-flex cursor-default items-center font-semibold tracking-tight ${lg ? "gap-4 text-5xl" : "gap-2 text-base"}`;

const INDIGO5 = ["#6366f1", "#6366f1", "#6366f1", "#6366f1", "#6366f1"];
const OPS = [0.55, 0.7, 0.85, 0.95, 1];

/* ── all purple, hover to play ────────────────────────────────────── */

const PURPLE: Mark[] = [
  {
    name: "Play on hover",
    note: "idles as quiet stubs (a meter at silence); hover presses play",
    render: (lg) => (
      <span className={wordmark(lg)}>
        Setlist <span className="text-indigo-400">Scout</span>
        <Bars lg={lg} colors={INDIGO5} ops={OPS} />
      </span>
    ),
  },
  {
    name: "Vanish",
    note: "nothing at rest — the meter only exists while you hover",
    render: (lg) => (
      <span className={wordmark(lg)}>
        Setlist <span className="text-indigo-400">Scout</span>
        <Bars lg={lg} colors={INDIGO5} ops={OPS} rest="hidden" />
      </span>
    ),
  },
  {
    name: "Staircase idle",
    note: "rests as a frozen ascending meter; hover breaks it loose",
    render: (lg) => (
      <span className={wordmark(lg)}>
        Setlist <span className="text-indigo-400">Scout</span>
        <Bars lg={lg} colors={INDIGO5} ops={OPS} rest="stair" />
      </span>
    ),
  },
  {
    name: "Scout lights up",
    note: "white at rest; hover bounces the meter AND flips Scout to indigo",
    render: (lg) => (
      <span className={wordmark(lg)}>
        Setlist{" "}
        <span className="transition-colors duration-300 group-hover:text-indigo-400">Scout</span>
        <Bars lg={lg} colors={INDIGO5} ops={OPS} />
      </span>
    ),
  },
];

/* ── static spectrum ramps across the five bars ───────────────────── */

const RAMPS: { name: string; note: string; colors: string[] }[] = [
  {
    name: "Indigo → cyan",
    note: "cool companion — ends at the site's mono-accent cousin",
    colors: ["#6366f1", "#7180f4", "#7c9cf5", "#74c3f2", "#67e8f9"],
  },
  {
    name: "Indigo → fuchsia",
    note: "warmer finish, stays jewel-toned",
    colors: ["#6366f1", "#8a7af2", "#b18df0", "#d787d8", "#f472b6"],
  },
  {
    name: "Indigo → rose",
    note: "boldest ramp — accent to alarm",
    colors: ["#6366f1", "#8d75ee", "#b77fdd", "#dc7bb5", "#fb7185"],
  },
  {
    name: "Violet depth",
    note: "a spectrum of purple only — dark to pale, still one hue family",
    colors: ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c4b5fd"],
  },
];

const SPECTRUM: Mark[] = RAMPS.map((ramp) => ({
  name: ramp.name,
  note: ramp.note,
  render: (lg: boolean) => (
    <span className={wordmark(lg)}>
      Setlist <span className="text-indigo-400">Scout</span>
      <Bars lg={lg} colors={ramp.colors} />
    </span>
  ),
}));

const SECTIONS = [
  {
    title: "All purple — hover to play",
    intro: "Five indigo bars, three bounce patterns at non-harmonic speeds. Hover any wordmark.",
    prefix: "P",
    marks: PURPLE,
  },
  {
    title: "Spectrum — static ramps",
    intro: "Same hover-to-play behavior; the five bars carry a fixed color ramp from purple outward. No color animates.",
    prefix: "G",
    marks: SPECTRUM,
  },
];

export default function Wordmarks4Page() {
  return (
    <div data-lab className="min-h-screen bg-zinc-950 text-zinc-100">
      <style>{`
        /* three distinct level patterns — multi-bump, not sine, so nothing undulates */
        @keyframes wm4A { 0% { transform: scaleY(.3); } 22% { transform: scaleY(.95); } 40% { transform: scaleY(.45); } 62% { transform: scaleY(1); } 80% { transform: scaleY(.35); } 100% { transform: scaleY(.3); } }
        @keyframes wm4B { 0% { transform: scaleY(.55); } 28% { transform: scaleY(.25); } 50% { transform: scaleY(.9); } 72% { transform: scaleY(.4); } 100% { transform: scaleY(.55); } }
        @keyframes wm4C { 0% { transform: scaleY(.7); } 25% { transform: scaleY(.4); } 48% { transform: scaleY(1); } 70% { transform: scaleY(.3); } 88% { transform: scaleY(.8); } 100% { transform: scaleY(.7); } }

        .wm4-bar {
          transform-origin: bottom;
          transition: opacity .25s ease, transform .3s ease;
        }
        .wm4:hover .wm4-bar {
          opacity: var(--o, 1);
          animation-duration: var(--d);
          animation-delay: var(--dl);
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .wm4:hover .wm4-a { animation-name: wm4A; }
        .wm4:hover .wm4-b { animation-name: wm4B; }
        .wm4:hover .wm4-c { animation-name: wm4C; }

        @media (prefers-reduced-motion: reduce) {
          .wm4:hover .wm4-bar { animation: none; }
        }
      `}</style>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-indigo-400">
          Design lab — wordmarks, round 4
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Hover to play</h1>
        <p className="mt-2 text-sm text-zinc-400">
          The meter idles until you hover, then bounces with the original energy — three bounce
          patterns at non-harmonic speeds so it reads as levels, never a wave. All purple, five
          bars; the second set carries a static color ramp instead. Nothing changes color over
          time. (On phones there&apos;s no hover — the rest state is the whole mark there, which is
          why the idle states matter.)
        </p>

        {SECTIONS.map((section) => (
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
                      {section.prefix}
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
        <Link href="/lab/wordmarks-3" className="rounded-full px-3 py-1 hover:bg-zinc-800">
          ← round 3
        </Link>
        <Link href="/lab" className="rounded-full px-3 py-1 hover:bg-zinc-800">
          lab index
        </Link>
      </nav>
    </div>
  );
}
