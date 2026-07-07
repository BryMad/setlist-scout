import type { CSSProperties } from "react";

/* The Setlist Scout wordmark (design-lab round 5 winner, "Hover shift ·
   fuchsia"): a frozen staircase meter climbs into the name; hovering plays
   it — bars bounce on three non-harmonic patterns while the meter and
   "Scout" turn indigo → fuchsia together (they share one currentColor) and
   "Setlist" blushes faintly. On touch devices the resting mark is the logo.
   Keyframes + classes live in globals.css under "wordmark". */

const DURS = [0.9, 1.25, 0.75, 1.4, 1.05]; // non-harmonic — never syncs into a wave
const DELAYS = [0, 0.2, 0.45, 0.1, 0.3];
const PATTERNS = ["wm-a", "wm-b", "wm-c", "wm-a", "wm-b"];
const STAIR = [0.25, 0.4, 0.55, 0.75, 1]; // ascending into the words

export default function Wordmark({ size = "header" }: { size?: "header" | "hero" }) {
  const lg = size === "hero";
  return (
    <span
      className={`wm group inline-flex items-center font-semibold tracking-tight ${
        lg ? "gap-3.5 text-4xl" : "gap-2 text-base"
      }`}
    >
      <span className="wm-shift inline-flex" aria-hidden>
        <span className={`inline-flex items-end ${lg ? "h-8 gap-1" : "h-3.5 gap-[2px]"}`}>
          {STAIR.map((scale, i) => (
            <span
              key={i}
              className={`wm-bar ${PATTERNS[i]} rounded-[1px] ${lg ? "w-1.5" : "w-[3px]"}`}
              style={
                {
                  background: "currentColor",
                  height: "100%",
                  opacity: 0.55 + i * 0.11,
                  transform: `scaleY(${scale})`,
                  "--d": `${DURS[i]}s`,
                  "--dl": `${DELAYS[i]}s`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      </span>
      <span className="text-zinc-100 transition-colors duration-500 group-hover:text-[#fce7f3]">
        Setlist
      </span>{" "}
      <span className="wm-shift">Scout</span>
    </span>
  );
}
