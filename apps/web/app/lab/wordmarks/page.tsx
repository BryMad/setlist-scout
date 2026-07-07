import Link from "next/link";
import type { ReactNode } from "react";

/* Wordmark lab: 15 treatments of the "Setlist Scout" title, each shown at
   header size (in a mock site header) and at hero size. Flat colors only —
   no gradients. Indigo accent + Geist, matching the shipped design system. */

const I = "text-indigo-400";

interface Mark {
  name: string;
  note: string;
  render: (lg: boolean) => ReactNode;
}

const MARKS: Mark[] = [
  {
    name: "Two-tone",
    note: "the color split you liked — flat, no gradient",
    render: (lg) => (
      <span className={`font-semibold tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        Setlist <span className={I}>Scout</span>
      </span>
    ),
  },
  {
    name: "Two-tone, no gap",
    note: "same split, compound word, tighter",
    render: (lg) => (
      <span className={`font-semibold tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        Setlist<span className={I}>Scout</span>
      </span>
    ),
  },
  {
    name: "Lowercase",
    note: "casual, app-y, still two-tone",
    render: (lg) => (
      <span className={`font-semibold tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        setlist<span className={I}>scout</span>
      </span>
    ),
  },
  {
    name: "Weight contrast",
    note: "one color, the split carried by weight alone",
    render: (lg) => (
      <span className={`tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        <span className="font-bold">Setlist</span>
        <span className="font-extralight text-zinc-300"> Scout</span>
      </span>
    ),
  },
  {
    name: "Mono scout",
    note: "sans + mono pairing — the site already speaks both",
    render: (lg) => (
      <span className={`font-semibold tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        Setlist{" "}
        <span className={`${I} font-mono font-medium`}>scout</span>
      </span>
    ),
  },
  {
    name: "Middot",
    note: "indigo interpunct as the only accent",
    render: (lg) => (
      <span className={`font-semibold tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        Setlist<span className={`${I} mx-1`}>·</span>Scout
      </span>
    ),
  },
  {
    name: "Slash",
    note: "route-y, nods to the predict/relive split",
    render: (lg) => (
      <span className={`font-semibold tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        Setlist<span className={`${I} mx-0.5 font-mono font-normal`}>/</span>Scout
      </span>
    ),
  },
  {
    name: "Cursor",
    note: "terminal blink — quietest possible night-city nod",
    render: (lg) => (
      <span className={`font-semibold tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        setlist scout<span className={`wm-blink ${I} font-mono`}>▊</span>
      </span>
    ),
  },
  {
    name: "Stacked",
    note: "vertical lockup — eyebrow + name",
    render: (lg) => (
      <span className="inline-flex flex-col leading-none">
        <span
          className={`font-mono uppercase text-zinc-500 ${lg ? "text-sm tracking-[0.5em]" : "text-[8px] tracking-[0.35em]"}`}
        >
          Setlist
        </span>
        <span className={`font-semibold tracking-tight ${lg ? "mt-1 text-5xl" : "text-base"}`}>
          Scout
        </span>
      </span>
    ),
  },
  {
    name: "Chip",
    note: "SCOUT as a tag — matches the confidence chip language",
    render: (lg) => (
      <span className={`inline-flex items-center font-semibold tracking-tight ${lg ? "gap-3 text-5xl" : "gap-1.5 text-base"}`}>
        Setlist
        <span
          className={`rounded-md border border-indigo-500/50 bg-indigo-500/10 font-mono font-medium uppercase text-indigo-300 ${
            lg ? "px-3 py-1 text-2xl" : "px-1.5 py-0.5 text-[10px]"
          }`}
        >
          Scout
        </span>
      </span>
    ),
  },
  {
    name: "Spectrum dots",
    note: "the five likelihood bands as the brand mark",
    render: (lg) => (
      <span className={`inline-flex items-baseline font-semibold tracking-tight ${lg ? "gap-4 text-5xl" : "gap-2 text-base"}`}>
        Setlist Scout
        <span className={`inline-flex ${lg ? "gap-1.5" : "gap-0.5"}`}>
          {["#8b5cf6", "#0ea5e9", "#eab308", "#f97316", "#e11d48"].map((c) => (
            <span
              key={c}
              className={`rounded-full ${lg ? "h-2.5 w-2.5" : "h-1 w-1"}`}
              style={{ background: c }}
            />
          ))}
        </span>
      </span>
    ),
  },
  {
    name: "Meter",
    note: "segmented cascade meter as a prefix glyph",
    render: (lg) => (
      <span className={`inline-flex items-center font-semibold tracking-tight ${lg ? "gap-4 text-5xl" : "gap-2 text-base"}`}>
        <span className={`inline-flex items-end ${lg ? "gap-1" : "gap-[2px]"}`}>
          {[0.35, 0.55, 0.75, 0.9, 1].map((h, idx) => (
            <span
              key={idx}
              className="rounded-[1px] bg-indigo-500"
              style={{
                width: lg ? 6 : 2.5,
                height: (lg ? 34 : 12) * h,
                opacity: 0.45 + idx * 0.14,
              }}
            />
          ))}
        </span>
        Setlist Scout
      </span>
    ),
  },
  {
    name: "Italic scout",
    note: "motion in the type itself",
    render: (lg) => (
      <span className={`font-semibold tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        Setlist <span className={`${I} italic`}>Scout</span>
      </span>
    ),
  },
  {
    name: "Caps tracked",
    note: "small, wide, architectural — very Geist",
    render: (lg) => (
      <span className={`font-medium uppercase ${lg ? "text-3xl tracking-[0.35em]" : "text-xs tracking-[0.25em]"}`}>
        Setlist <span className={I}>Scout</span>
      </span>
    ),
  },
  {
    name: "Monogram",
    note: "SS block + name — gives us an app icon for free",
    render: (lg) => (
      <span className={`inline-flex items-center font-semibold tracking-tight ${lg ? "gap-4 text-5xl" : "gap-2 text-base"}`}>
        <span
          className={`inline-flex items-center justify-center rounded-md bg-indigo-600 font-bold text-white ${
            lg ? "h-14 w-14 text-3xl" : "h-6 w-6 text-[11px]"
          }`}
        >
          SS
        </span>
        Setlist Scout
      </span>
    ),
  },
  {
    name: "Full stop",
    note: "confident period, indigo — smallest possible mark",
    render: (lg) => (
      <span className={`font-bold tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        Setlist Scout<span className={I}>.</span>
      </span>
    ),
  },
];

export default function WordmarksPage() {
  return (
    <div data-lab className="min-h-screen bg-zinc-950 text-zinc-100">
      <style>{`
        @keyframes wmBlink { 50% { opacity: 0; } }
        .wm-blink { animation: wmBlink 1.1s steps(1) infinite; }
      `}</style>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-indigo-400">
          Design lab — wordmarks
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Fifteen ways to say Setlist Scout
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Each shown at header size (in the real header chrome) and hero size. All flat color —
          no gradients. Squint at the small one first; that&apos;s where the wordmark lives 95% of
          the time.
        </p>

        <ol className="mt-10 space-y-10">
          {MARKS.map((mark, i) => (
            <li key={mark.name}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-zinc-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold">{mark.name}</span>
                <span className="text-sm text-zinc-500">— {mark.note}</span>
              </div>

              {/* header-size, in real header chrome */}
              <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
                <div className="flex h-14 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-6">
                  {mark.render(false)}
                  <div className="w-44 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-600">
                    Search for an artist…
                  </div>
                </div>

                {/* hero-size */}
                <div className="flex items-center bg-zinc-950 px-6 py-12">
                  {mark.render(true)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </main>

      <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-950/90 px-2 py-1.5 font-mono text-xs text-zinc-300 shadow-2xl backdrop-blur">
        <Link href="/lab" className="rounded-full px-3 py-1 hover:bg-zinc-800">
          ← lab index
        </Link>
      </nav>
    </div>
  );
}
