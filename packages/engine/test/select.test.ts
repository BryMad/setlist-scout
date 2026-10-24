import { describe, expect, it } from "vitest";
import {
  daysBetween,
  selectAuto,
  selectLastNShows,
  selectLatestTour,
  selectNamedTour,
  selectRecentRun,
  selectShow,
  peakShowShare,
  coverageShare,
} from "../src/select.ts";
import { assessQuality } from "../src/quality.ts";
import { loadShows, makeShow } from "./helpers.ts";

const TODAY = "2026-07-02";
const kept = (artist: string) => assessQuality(loadShows(artist)).kept;

describe("daysBetween", () => {
  it("computes whole days across month and year boundaries", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
    expect(daysBetween("2026-01-01", "2026-01-01")).toBe(0);
  });
});

describe("selectors (synthetic)", () => {
  it("selectLatestTour anchors on the newest toured show", () => {
    const shows = [
      makeShow(20, { date: "2026-06-01", tourName: null }), // newer but untoured
      makeShow(20, { date: "2026-05-01", tourName: "New Tour" }),
      makeShow(20, { date: "2026-04-01", tourName: "New Tour" }),
      makeShow(20, { date: "2025-01-01", tourName: "Old Tour" }),
    ];
    const selection = selectLatestTour(shows)!;
    expect(selection.tourName).toBe("New Tour");
    expect(selection.shows).toHaveLength(2);
  });

  it("selectLatestTour returns null when nothing has tour attribution", () => {
    expect(selectLatestTour([makeShow(20, { tourName: null })])).toBeNull();
  });

  it("selectLastNShows returns the n newest, newest first", () => {
    const shows = [
      makeShow(20, { date: "2026-01-01" }),
      makeShow(20, { date: "2026-03-01" }),
      makeShow(20, { date: "2026-02-01" }),
    ];
    const selection = selectLastNShows(shows, 2);
    expect(selection.shows.map((s) => s.date)).toEqual(["2026-03-01", "2026-02-01"]);
  });

  it("selectShow finds one show by id", () => {
    const target = makeShow(20, { date: "2026-02-01" });
    const selection = selectShow([makeShow(20), target], target.id)!;
    expect(selection.shows).toEqual([target]);
    expect(selectShow([target], "nope")).toBeNull();
  });
});

describe("selectRecentRun", () => {
  it("clusters by date gap, ignoring tour tags — the Cola shape", () => {
    // 12 untagged shows over six weeks, a year of silence, then an older
    // untagged run and a thin named tour. The current run must win.
    const current = Array.from({ length: 12 }, (_, i) =>
      makeShow(12, { date: `2026-07-${String(22 - i).padStart(2, "0")}`, tourName: null })
    );
    const older = [
      makeShow(12, { date: "2025-07-19", tourName: null }),
      makeShow(12, { date: "2025-06-14", tourName: null }),
      makeShow(12, { date: "2025-06-12", tourName: "All Ireland Tour" }),
      makeShow(12, { date: "2025-06-07", tourName: "All Ireland Tour" }),
      makeShow(12, { date: "2025-05-28", tourName: "All Ireland Tour" }),
    ];
    const run = selectRecentRun([...older, ...current])!;
    expect(run.strategy).toBe("recent-run");
    expect(run.tourName).toBeNull();
    expect(run.shows).toHaveLength(12);
    expect(run.shows[0]!.date).toBe("2026-07-22");
  });

  it("a short gap merges tagged and untagged shows; the tag becomes the label", () => {
    const shows = [
      makeShow(12, { date: "2025-06-14", tourName: null }),
      makeShow(12, { date: "2025-06-12", tourName: "All Ireland Tour" }),
      makeShow(12, { date: "2025-06-07", tourName: "All Ireland Tour" }),
    ];
    const run = selectRecentRun(shows)!;
    expect(run.strategy).toBe("latest-tour");
    expect(run.tourName).toBe("All Ireland Tour");
    expect(run.shows).toHaveLength(3);
  });

  it("a matching tour name bridges a long gap between legs", () => {
    const shows = [
      makeShow(20, { date: "2026-06-01", tourName: "World Tour" }),
      makeShow(20, { date: "2026-05-30", tourName: "World Tour" }),
      makeShow(20, { date: "2026-01-15", tourName: "World Tour" }), // 135-day layoff
      makeShow(20, { date: "2026-01-14", tourName: "World Tour" }),
    ];
    expect(selectRecentRun(shows)!.shows).toHaveLength(4);
  });

  it("an untagged one-off between two legs rides along; a long untagged stretch ends the run", () => {
    // Metallica's real shape: M72 leg → 127 days → untagged special → 75 days → M72 leg
    const oneOff = [
      makeShow(16, { date: "2025-04-19", tourName: "M72" }),
      makeShow(13, { date: "2024-12-13", tourName: null }),
      makeShow(16, { date: "2024-09-29", tourName: "M72" }),
      makeShow(16, { date: "2024-09-27", tourName: "M72" }),
    ];
    const run = selectRecentRun(oneOff)!;
    expect(run.shows).toHaveLength(4);
    expect(run.tourName).toBe("M72");

    // same tag on the far side, but the untagged stretch between spans 90 days → its own era
    const stretch = [
      makeShow(16, { date: "2025-04-19", tourName: "M72" }),
      makeShow(13, { date: "2024-12-13", tourName: null }),
      makeShow(13, { date: "2024-11-01", tourName: null }),
      makeShow(13, { date: "2024-09-14", tourName: null }),
      makeShow(16, { date: "2024-06-29", tourName: "M72" }),
    ];
    expect(selectRecentRun(stretch)!.shows).toHaveLength(1);

    // the far side carries a different tag → the one-off doesn't get pulled in either
    const otherTour = [
      makeShow(16, { date: "2025-04-19", tourName: "M72" }),
      makeShow(13, { date: "2024-12-13", tourName: null }),
      makeShow(16, { date: "2024-09-29", tourName: "72 Seasons Tour" }),
    ];
    expect(selectRecentRun(otherTour)!.shows).toHaveLength(1);
  });

  it("a long gap with a different tag, or no tag, ends the run", () => {
    const differentTag = [
      makeShow(20, { date: "2026-06-01", tourName: "Spring Tour" }),
      makeShow(20, { date: "2026-01-15", tourName: "Winter Tour" }),
    ];
    expect(selectRecentRun(differentTag)!.shows).toHaveLength(1);

    const untaggedAcross = [
      makeShow(20, { date: "2026-06-01", tourName: "Spring Tour" }),
      makeShow(20, { date: "2026-01-15", tourName: null }),
    ];
    expect(selectRecentRun(untaggedAcross)!.shows).toHaveLength(1);

    const untaggedBoth = [
      makeShow(20, { date: "2026-06-01", tourName: null }),
      makeShow(20, { date: "2026-01-15", tourName: null }),
    ];
    expect(selectRecentRun(untaggedBoth)!.shows).toHaveLength(1);
  });

  it("maxGapDays is tunable", () => {
    const shows = [
      makeShow(20, { date: "2026-06-01", tourName: null }),
      makeShow(20, { date: "2026-04-01", tourName: null }), // 61 days
    ];
    expect(selectRecentRun(shows)!.shows).toHaveLength(1);
    expect(selectRecentRun(shows, { maxGapDays: 90 })!.shows).toHaveLength(2);
    expect(selectRecentRun([])).toBeNull();
  });

  it("Metallica: multi-leg M72 stays one run via tag bridging, untagged one-offs inside it ride along", () => {
    const run = selectRecentRun(kept("metallica"))!;
    const named = selectLatestTour(kept("metallica"))!;
    expect(run.tourName).toBe("M72 World Tour");
    // every named-tour show is in the run, plus the few untagged specials
    // that fall inside the tour's span (they'd be cut by strict tag matching)
    const runIds = new Set(run.shows.map((show) => show.id));
    expect(named.shows.every((show) => runIds.has(show.id))).toBe(true);
    expect(run.shows.length - named.shows.length).toBeLessThanOrEqual(5);
    expect(run.shows[run.shows.length - 1]!.date).toBe(named.shows[named.shows.length - 1]!.date);
  });
});

describe("selectors against captured fixtures", () => {
  it("U2: latest tour is Sphere with all 40 shows (promo one-offs already filtered)", () => {
    const selection = selectLatestTour(kept("u2"))!;
    expect(selection.tourName).toBe("U2:UV Achtung Baby Live at Sphere");
    expect(selection.shows).toHaveLength(40);
  });

  it("Metallica: multi-year M72 tour comes back as one selection", () => {
    const selection = selectLatestTour(kept("metallica"))!;
    expect(selection.tourName).toBe("M72 World Tour");
    expect(selection.shows.length).toBeGreaterThan(90);
  });

  it("Phish: named tour selection returns the full Summer 2025 run", () => {
    const selection = selectNamedTour(kept("phish"), "Summer Tour 2025")!;
    expect(selection.shows).toHaveLength(31);
  });

  it("last-60 slice is newest-first and capped", () => {
    const selection = selectLastNShows(kept("u2"), 60);
    expect(selection.shows).toHaveLength(60);
    const dates = selection.shows.map((s) => s.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});

describe("peakShowShare", () => {
  it("is 1 when a song plays every show, and low for disjoint setlists", () => {
    const stable = [
      makeShow(["Staple", "Filler A"]),
      makeShow(["Staple", "Filler B"]),
    ];
    expect(peakShowShare(stable)).toBe(1);

    const rotating = [makeShow(["A", "B"]), makeShow(["C", "D"]), makeShow(["E", "F"])];
    expect(peakShowShare(rotating)).toBeCloseTo(1 / 3);
    expect(peakShowShare([])).toBe(0);
  });

  it("ignores tape entries", () => {
    const shows = [makeShow(["Real A"]), makeShow(["Real B"])];
    for (const show of shows) {
      show.songs.push({ name: "Intro Tape", isTape: true, isEncore: false, isCover: false, coverArtist: null });
    }
    expect(peakShowShare(shows)).toBe(0.5);
  });
});

describe("coverageShare", () => {
  it("is ~1 for a fixed setlist and low for full rotation", () => {
    const stable = [
      makeShow(["A", "B", "C"]),
      makeShow(["A", "B", "C"]),
    ];
    expect(coverageShare(stable)).toBe(1);

    const rotating = [makeShow(["A", "B"]), makeShow(["C", "D"]), makeShow(["E", "F"])];
    expect(coverageShare(rotating)).toBeCloseTo(1 / 3);
    expect(coverageShare([])).toBe(0);
  });

  it("sees through the anchor-song band that peakShowShare misreads", () => {
    // one hit played every night, everything else rotates completely
    const anchor = [
      makeShow(["The Hit", "A", "B"]),
      makeShow(["The Hit", "C", "D"]),
      makeShow(["The Hit", "E", "F"]),
    ];
    expect(peakShowShare(anchor)).toBe(1); // looks perfectly stable
    expect(coverageShare(anchor)).toBeCloseTo((1 + 1 / 3 + 1 / 3) / 3); // it isn't
  });
});

describe("selectAuto route-picker", () => {
  it("returns null with no data", () => {
    expect(selectAuto([], { asOf: TODAY })).toBeNull();
  });

  it("Oasis: healthy fresh tour → latest-tour, high confidence", () => {
    const decision = selectAuto(kept("oasis"), { asOf: TODAY })!;
    expect(decision.selection.strategy).toBe("latest-tour");
    expect(decision.selection.tourName).toBe("Oasis Live ’25");
    expect(decision.selection.shows).toHaveLength(41);
    expect(decision.confidence).toBe("high");
    expect(decision.signals).toEqual([
      { kind: "healthy-recent-run", tourName: "Oasis Live ’25", showCount: 41 },
    ]);
  });

  it("Phish: healthy tour but total rotation → widens to last-n, medium confidence", () => {
    const decision = selectAuto(kept("phish"), { asOf: TODAY })!;
    expect(decision.selection.strategy).toBe("last-n-shows");
    expect(decision.selection.shows).toHaveLength(60);
    expect(decision.confidence).toBe("medium");
    const rotation = decision.signals.find((s) => s.kind === "high-rotation")!;
    expect(rotation).toMatchObject({
      tourName: "Sphere Las Vegas 2026",
      widenedTo: 60,
    });
    expect((rotation as { coverage: number }).coverage).toBeLessThan(0.2);
  });

  it("Metallica: no-repeat-weekend format still reads as stable, no widening", () => {
    const decision = selectAuto(kept("metallica"), { asOf: TODAY })!;
    expect(decision.selection.strategy).toBe("latest-tour");
    expect(decision.selection.tourName).toBe("M72 World Tour");
    expect(decision.signals.some((s) => s.kind === "high-rotation")).toBe(false);
    expect(decision.confidence).toBe("high");
  });

  it("U2: healthy tour but 850+ days dormant → stale signal, medium confidence", () => {
    const decision = selectAuto(kept("u2"), { asOf: TODAY })!;
    expect(decision.selection.strategy).toBe("latest-tour");
    const stale = decision.signals.find((s) => s.kind === "stale-data");
    expect(stale).toMatchObject({ newestShowDate: "2024-03-02" });
    expect(decision.confidence).toBe("medium");
  });

  it("Talking Heads: decades dormant → low confidence", () => {
    const decision = selectAuto(kept("talking-heads"), { asOf: TODAY })!;
    expect(decision.confidence).toBe("low");
    expect(decision.signals.some((s) => s.kind === "stale-data")).toBe(true);
  });

  it("a thin run under a never-before-seen tour name is trusted on its own (night one of a new tour)", () => {
    const shows = [
      makeShow(20, { date: "2026-06-20", tourName: "Brand New Tour" }),
      makeShow(20, { date: "2026-06-21", tourName: "Brand New Tour" }),
      makeShow(20, { date: "2026-06-22", tourName: "Brand New Tour" }),
      ...Array.from({ length: 30 }, (_, i) =>
        makeShow(20, {
          date: `2025-0${(i % 9) + 1}-1${i % 10}`,
          tourName: "Previous Tour",
        })
      ),
    ];
    const decision = selectAuto(shows, { asOf: TODAY })!;
    expect(decision.selection.strategy).toBe("latest-tour");
    expect(decision.selection.tourName).toBe("Brand New Tour");
    expect(decision.selection.shows).toHaveLength(3);
    expect(decision.signals).toEqual([
      { kind: "new-tour", tourName: "Brand New Tour", showCount: 3 },
    ]);
    expect(decision.confidence).toBe("medium");
  });

  it("a single show of a brand-new tour is still trusted, at low confidence (the Beck night-one case)", () => {
    const shows = [
      makeShow(25, { date: "2026-06-22", tourName: "Ride Lonesome" }),
      ...Array.from({ length: 13 }, (_, i) =>
        makeShow(24, { date: `2025-07-${String(i + 15).padStart(2, "0")}`, tourName: "2025 Orchestral" })
      ),
    ];
    const decision = selectAuto(shows, { asOf: TODAY })!;
    expect(decision.selection.strategy).toBe("latest-tour");
    expect(decision.selection.shows).toHaveLength(1);
    expect(decision.signals[0]).toEqual({ kind: "new-tour", tourName: "Ride Lonesome", showCount: 1 });
    expect(decision.confidence).toBe("low");
  });

  it("a thin run whose tour name has appeared before still widens to last-n", () => {
    // leg two of a known tour, cut off from leg one by a long untagged stretch
    const shows = [
      makeShow(20, { date: "2026-06-20", tourName: "World Tour" }),
      makeShow(20, { date: "2026-06-21", tourName: "World Tour" }),
      makeShow(20, { date: "2026-04-01", tourName: null }),
      makeShow(20, { date: "2026-01-15", tourName: null }),
      ...Array.from({ length: 30 }, (_, i) =>
        makeShow(20, {
          date: `2025-0${(i % 9) + 1}-1${i % 10}`,
          tourName: "World Tour",
        })
      ),
    ];
    const decision = selectAuto(shows, { asOf: TODAY })!;
    expect(decision.selection.strategy).toBe("last-n-shows");
    expect(decision.signals[0]).toMatchObject({
      kind: "thin-recent-run",
      tourName: "World Tour",
      showCount: 2,
    });
    expect(decision.confidence).toBe("medium");
  });

  it("rotation with nothing to widen into keeps the tour but flags it", () => {
    // one long tour of fully disjoint setlists and no older history
    const shows = Array.from({ length: 10 }, (_, i) =>
      makeShow([`Unique ${i}A`, `Unique ${i}B`], {
        date: `2026-06-${String(i + 1).padStart(2, "0")}`,
        tourName: "Endless Tour",
      })
    );
    const decision = selectAuto(shows, { asOf: TODAY })!;
    expect(decision.selection.strategy).toBe("latest-tour");
    expect(decision.signals[0]).toMatchObject({
      kind: "high-rotation",
      tourName: "Endless Tour",
      widenedTo: null,
    });
    expect(decision.confidence).toBe("medium");
  });

  it("a healthy untagged run is trusted on its own — no widening (the Cola fix)", () => {
    const shows = Array.from({ length: 10 }, (_, i) =>
      makeShow(15, { date: `2026-06-0${(i % 9) + 1}`, tourName: null })
    );
    const decision = selectAuto(shows, { asOf: TODAY })!;
    expect(decision.selection.strategy).toBe("recent-run");
    expect(decision.selection.tourName).toBeNull();
    expect(decision.selection.shows).toHaveLength(10);
    expect(decision.signals).toEqual([
      { kind: "healthy-recent-run", tourName: null, showCount: 10 },
    ]);
    expect(decision.confidence).toBe("high");
  });

  it("a thin untagged run widens, with the run's size in the signal", () => {
    const shows = [
      makeShow(15, { date: "2026-06-20", tourName: null }),
      makeShow(15, { date: "2026-06-21", tourName: null }),
      ...Array.from({ length: 20 }, (_, i) =>
        makeShow(15, { date: `2025-0${(i % 9) + 1}-1${i % 10}`, tourName: null })
      ),
    ];
    const decision = selectAuto(shows, { asOf: TODAY })!;
    expect(decision.selection.strategy).toBe("last-n-shows");
    expect(decision.signals[0]).toEqual({
      kind: "thin-recent-run",
      tourName: null,
      showCount: 2,
      widenedTo: 22,
    });
  });
});
