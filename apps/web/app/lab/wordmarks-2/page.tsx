import Link from "next/link";
import type { ReactNode } from "react";
import {
  Audiowide,
  Bebas_Neue,
  Bungee,
  DotGothic16,
  Michroma,
  Monoton,
  Russo_One,
  Six_Caps,
  Space_Grotesk,
  Stalinist_One,
  Syncopate,
  Unbounded,
  Zen_Dots,
} from "next/font/google";

/* Wordmark lab, round 2 — wilder. Real display faces (constructivist,
   sci-fi, neon marquee, poster condensed) and living color: slow
   James-Turrell-style drift instead of static gradients. Every fill is a
   flat color at any given instant; only time moves. */

const stalinist = Stalinist_One({ weight: "400", subsets: ["latin"] });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"] });
const russo = Russo_One({ weight: "400", subsets: ["latin"] });
const michroma = Michroma({ weight: "400", subsets: ["latin"] });
const monoton = Monoton({ weight: "400", subsets: ["latin"] });
const audiowide = Audiowide({ weight: "400", subsets: ["latin"] });
const bungee = Bungee({ weight: "400", subsets: ["latin"] });
const sixcaps = Six_Caps({ weight: "400", subsets: ["latin"] });
const syncopate = Syncopate({ weight: ["400", "700"], subsets: ["latin"] });
const dotgothic = DotGothic16({ weight: "400", subsets: ["latin"] });
const zendots = Zen_Dots({ weight: "400", subsets: ["latin"] });
const grotesk = Space_Grotesk({ subsets: ["latin"] });
const unbounded = Unbounded({ subsets: ["latin"] });

interface Mark {
  name: string;
  note: string;
  render: (lg: boolean) => ReactNode;
}

const MARKS: Mark[] = [
  {
    name: "Agitprop",
    note: "Stalinist One — constructivist block, red plate behind SCOUT",
    render: (lg) => (
      <span className={`${stalinist.className} inline-flex items-center uppercase ${lg ? "gap-3 text-4xl" : "gap-1.5 text-sm"}`}>
        Setlist
        <span
          className={`inline-block bg-[#b91c1c] text-[#f5efe0] ${lg ? "px-3 py-1" : "px-1.5 py-0.5"}`}
          style={{ transform: "rotate(-1.5deg)" }}
        >
          Scout
        </span>
      </span>
    ),
  },
  {
    name: "Poster stack",
    note: "Bebas Neue — condensed propaganda-poster lockup, red rule",
    render: (lg) => (
      <span className={`${bebas.className} inline-flex flex-col uppercase leading-[0.85]`}>
        <span className={lg ? "text-6xl" : "text-lg"}>Setlist</span>
        <span className={`bg-[#b91c1c] ${lg ? "my-1 h-1.5 w-full" : "my-0.5 h-[2px] w-full"}`} />
        <span className={`text-[#b91c1c] ${lg ? "text-6xl" : "text-lg"}`}>Scout</span>
      </span>
    ),
  },
  {
    name: "Russo",
    note: "Russo One — heavy Cyrillic-adjacent, wears indigo well",
    render: (lg) => (
      <span className={`${russo.className} ${lg ? "text-5xl" : "text-base"}`}>
        Setlist <span className="text-indigo-400">Scout</span>
      </span>
    ),
  },
  {
    name: "Starfield",
    note: "Michroma — wide NASA-panel sci-fi; tracking slowly breathes",
    render: (lg) => (
      <span className={`${michroma.className} wm-track uppercase ${lg ? "text-3xl" : "text-xs"}`}>
        Setlist<span className="text-indigo-400"> Scout</span>
      </span>
    ),
  },
  {
    name: "Marquee",
    note: "Monoton — neon venue signage; it's a concert app, after all",
    render: (lg) => (
      <span className={`${monoton.className} uppercase text-indigo-300 ${lg ? "text-5xl" : "text-base"}`}>
        Setlist Scout
      </span>
    ),
  },
  {
    name: "Audiowide",
    note: "retro-futurist speedometer type",
    render: (lg) => (
      <span className={`${audiowide.className} ${lg ? "text-4xl" : "text-sm"}`}>
        Setlist<span className="text-indigo-400">Scout</span>
      </span>
    ),
  },
  {
    name: "Aperture",
    note: "Turrell skyspace — a light field drifting through dusk, type stays still",
    render: (lg) => (
      <span
        className={`wm-field inline-block rounded-xl font-semibold tracking-tight text-white ${
          lg ? "px-8 py-5 text-5xl" : "px-3 py-1 text-base"
        }`}
      >
        Setlist Scout
      </span>
    ),
  },
  {
    name: "Dusk drift",
    note: "plain Geist, but Scout's color drifts like gallery light (40s loop)",
    render: (lg) => (
      <span className={`font-semibold tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        Setlist <span className="wm-drift">Scout</span>
      </span>
    ),
  },
  {
    name: "Breathe",
    note: "Space Grotesk variable — Scout's weight slowly inhales and exhales",
    render: (lg) => (
      <span className={`${grotesk.className} tracking-tight ${lg ? "text-5xl" : "text-base"}`}>
        <span className="font-semibold">Setlist</span>{" "}
        <span className="wm-breathe text-indigo-400">Scout</span>
      </span>
    ),
  },
  {
    name: "Bungee",
    note: "street-signage chrome-shop letters",
    render: (lg) => (
      <span className={`${bungee.className} uppercase ${lg ? "text-4xl" : "text-sm"}`}>
        Setlist <span className="text-indigo-400">Scout</span>
      </span>
    ),
  },
  {
    name: "Tower",
    note: "Six Caps — ultra-condensed editorial column",
    render: (lg) => (
      <span className={`${sixcaps.className} inline-flex uppercase leading-[0.9] ${lg ? "gap-3" : "gap-1"}`}>
        <span className={lg ? "text-7xl" : "text-xl"}>Setlist</span>
        <span className={`text-indigo-400 ${lg ? "text-7xl" : "text-xl"}`}>Scout</span>
      </span>
    ),
  },
  {
    name: "Syncopate",
    note: "wide modernist caps, bold/regular split",
    render: (lg) => (
      <span className={`${syncopate.className} uppercase ${lg ? "text-3xl" : "text-[11px]"}`}>
        <span className="font-bold">Setlist</span>
        <span className="text-indigo-400"> Scout</span>
      </span>
    ),
  },
  {
    name: "Pixel",
    note: "DotGothic16 — the arcade nod, quieter than Press Start",
    render: (lg) => (
      <span className={`${dotgothic.className} ${lg ? "text-5xl" : "text-base"}`}>
        SETLIST <span className="text-indigo-400">SCOUT</span>
      </span>
    ),
  },
  {
    name: "Zen Dots",
    note: "round mecha-tech display",
    render: (lg) => (
      <span className={`${zendots.className} ${lg ? "text-4xl" : "text-sm"}`}>
        Setlist <span className="text-indigo-400">Scout</span>
      </span>
    ),
  },
  {
    name: "Unbounded",
    note: "contemporary display, generous curves — with the dusk drift on Scout",
    render: (lg) => (
      <span className={`${unbounded.className} font-medium ${lg ? "text-4xl" : "text-sm"}`}>
        Setlist <span className="wm-drift">Scout</span>
      </span>
    ),
  },
  {
    name: "Spectrum pulse",
    note: "round-1 band dots, now breathing in sequence",
    render: (lg) => (
      <span className={`inline-flex items-baseline font-semibold tracking-tight ${lg ? "gap-4 text-5xl" : "gap-2 text-base"}`}>
        Setlist Scout
        <span className={`inline-flex ${lg ? "gap-1.5" : "gap-0.5"}`}>
          {["#8b5cf6", "#0ea5e9", "#eab308", "#f97316", "#e11d48"].map((c, idx) => (
            <span
              key={c}
              className={`wm-pulse rounded-full ${lg ? "h-2.5 w-2.5" : "h-1 w-1"}`}
              style={{ background: c, animationDelay: `${idx * 0.5}s` }}
            />
          ))}
        </span>
      </span>
    ),
  },
  {
    name: "VU meters",
    note: "the dots become bouncing level meters, spectrum-colored",
    render: (lg) => (
      <span className={`inline-flex items-center font-semibold tracking-tight ${lg ? "gap-4 text-5xl" : "gap-2 text-base"}`}>
        Setlist Scout
        <span className={`inline-flex items-end ${lg ? "h-9 gap-1.5" : "h-3.5 gap-[2px]"}`}>
          {["#8b5cf6", "#0ea5e9", "#eab308", "#f97316", "#e11d48"].map((c, idx) => (
            <span
              key={c}
              className={`wm-eq rounded-[1px] ${lg ? "w-1.5" : "w-[3px]"}`}
              style={{
                background: c,
                height: "100%",
                animationDuration: `${0.7 + (idx % 3) * 0.23}s`,
                animationDelay: `${idx * 0.09}s`,
              }}
            />
          ))}
        </span>
      </span>
    ),
  },
  {
    name: "VU synced",
    note: "meters bounce while Scout pulses through the band colors in rhythm",
    render: (lg) => (
      <span className={`inline-flex items-center font-semibold tracking-tight ${lg ? "gap-4 text-5xl" : "gap-2 text-base"}`}>
        Setlist <span className="wm-scoutpulse">Scout</span>
        <span className={`inline-flex items-end ${lg ? "h-9 gap-1.5" : "h-3.5 gap-[2px]"}`}>
          {["#8b5cf6", "#0ea5e9", "#eab308", "#f97316", "#e11d48"].map((c, idx) => (
            <span
              key={c}
              className={`wm-eq rounded-[1px] ${lg ? "w-1.5" : "w-[3px]"}`}
              style={{
                background: c,
                height: "100%",
                animationDuration: `${0.7 + (idx % 3) * 0.23}s`,
                animationDelay: `${idx * 0.09}s`,
              }}
            />
          ))}
        </span>
      </span>
    ),
  },
  {
    name: "Stereo",
    note: "L/R channel meters flanking the name, indigo only — quietest of the three",
    render: (lg) => (
      <span className={`inline-flex items-center font-semibold tracking-tight ${lg ? "gap-4 text-5xl" : "gap-2 text-base"}`}>
        <span className={`inline-flex items-end ${lg ? "h-8 gap-1" : "h-3 gap-[2px]"}`}>
          {[0, 1, 2].map((idx) => (
            <span
              key={idx}
              className={`wm-eq rounded-[1px] bg-indigo-500 ${lg ? "w-1.5" : "w-[3px]"}`}
              style={{
                height: "100%",
                opacity: 0.5 + idx * 0.25,
                animationDuration: `${0.75 + idx * 0.2}s`,
              }}
            />
          ))}
        </span>
        Setlist <span className="text-indigo-400">Scout</span>
        <span className={`inline-flex items-end ${lg ? "h-8 gap-1" : "h-3 gap-[2px]"}`}>
          {[0, 1, 2].map((idx) => (
            <span
              key={idx}
              className={`wm-eq rounded-[1px] bg-indigo-500 ${lg ? "w-1.5" : "w-[3px]"}`}
              style={{
                height: "100%",
                opacity: 1 - idx * 0.25,
                animationDuration: `${1.15 - idx * 0.2}s`,
              }}
            />
          ))}
        </span>
      </span>
    ),
  },
];

export default function Wordmarks2Page() {
  return (
    <div data-lab className="min-h-screen bg-zinc-950 text-zinc-100">
      <style>{`
        /* Turrell aperture: a color field drifting through dusk. Flat color
           at every instant — only time moves. */
        @keyframes wmField {
          0%   { background-color: #1e1b4b; }
          22%  { background-color: #4c1d95; }
          45%  { background-color: #831843; }
          68%  { background-color: #7c2d12; }
          85%  { background-color: #1e3a8a; }
          100% { background-color: #1e1b4b; }
        }
        .wm-field { animation: wmField 26s ease-in-out infinite; }

        @keyframes wmDrift {
          0%   { color: #818cf8; }
          30%  { color: #a78bfa; }
          55%  { color: #67e8f9; }
          80%  { color: #f0abfc; }
          100% { color: #818cf8; }
        }
        .wm-drift { animation: wmDrift 40s ease-in-out infinite; }

        @keyframes wmBreathe {
          0%, 100% { font-weight: 300; }
          50% { font-weight: 700; }
        }
        .wm-breathe { animation: wmBreathe 7s ease-in-out infinite; }

        @keyframes wmTrack {
          0%, 100% { letter-spacing: 0.18em; }
          50% { letter-spacing: 0.3em; }
        }
        .wm-track { animation: wmTrack 14s ease-in-out infinite; }

        @keyframes wmPulse {
          0%, 100% { opacity: .35; transform: scale(.85); }
          50% { opacity: 1; transform: scale(1); }
        }
        .wm-pulse { animation: wmPulse 2.5s ease-in-out infinite; }

        /* stereo level meters: each bar bounces on its own period, like
           channels reacting to different frequencies */
        @keyframes wmEq {
          0%, 100% { transform: scaleY(.22); }
          50% { transform: scaleY(1); }
        }
        .wm-eq { transform-origin: bottom; animation: wmEq 1s ease-in-out infinite alternate; }

        /* Scout pulsing through the five band colors on the meters' rhythm */
        @keyframes wmScoutPulse {
          0%   { color: #8b5cf6; }
          20%  { color: #0ea5e9; }
          40%  { color: #eab308; }
          60%  { color: #f97316; }
          80%  { color: #e11d48; }
          100% { color: #8b5cf6; }
        }
        .wm-scoutpulse { animation: wmScoutPulse 4.6s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .wm-field, .wm-drift, .wm-breathe, .wm-track, .wm-pulse, .wm-eq, .wm-scoutpulse { animation: none; }
        }
      `}</style>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-indigo-400">
          Design lab — wordmarks, round 2
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Wilder this time</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Display faces from agitprop to arcade, plus living color — slow Turrell-style drift
          instead of gradients. Nothing here is a gradient fill; the drifting ones are flat color
          that moves through time. Watch Aperture, Dusk drift, and Breathe for ~20 seconds before
          judging them.
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
        <Link href="/lab/wordmarks" className="rounded-full px-3 py-1 hover:bg-zinc-800">
          ← round 1
        </Link>
        <Link href="/lab" className="rounded-full px-3 py-1 hover:bg-zinc-800">
          lab index
        </Link>
      </nav>
    </div>
  );
}
