# How `predict({ mode: "auto" })` decides what to analyze

Traced 2026-09-11 against `packages/engine/src/select.ts` + `predict.ts`
as they stood *before* the recent-run fix (with the `coverageShare` change
already in). Grounded in a real pull for **Cola** to show exactly where it
went wrong. The fix is described at the bottom; the flow section is kept
as the "before" picture.

## The flow (before the fix)

```
predict(shows, { mode: "auto" })
  │
  ├─ 1. assessQuality(ALL shows)            ← quality filter runs FIRST,
  │       kept:     songCount > threshold      over the WHOLE fetched history,
  │       excluded: empty-setlist / short-set  before any tour/date logic
  │
  └─ 2. selectAuto(kept shows)
        │
        ├─ selectLatestTour(kept)
        │     sort kept shows newest→oldest
        │     anchor = first show whose tourName != null
        │     → group = every kept show with that exact tourName
        │     (shows with NO tour name are invisible to this search —
        │      it skips right over them, no matter how recent)
        │
        ├─ if no anchor found at all:
        │     signal: "no-tour-attribution"
        │     → selection = last 60 KEPT shows (selectLastNShows)
        │
        ├─ if anchor found, group.length < minTourSample (8):
        │     signal: "thin-latest-tour"
        │     → selection = last 60 KEPT shows  ← same fallback, unbounded by date
        │
        └─ if anchor found, group.length >= 8:
              coverage = coverageShare(group)   ← NEW: best-guess-setlist
                                                    coverage of a typical night
              ├─ coverage >= 0.5 → selection = the named tour, as-is
              │     signal: "healthy-latest-tour"
              │
              └─ coverage < 0.5  → rotation artist, widen
                    signal: "high-rotation"
                    → selection = last 60 KEPT shows, UNLESS that widened
                      window doesn't actually reach past this tour anyway
```

`selectLastNShows(shows, N)` has no date logic at all — it just sorts by
date and takes the top N. If the *entire* kept history is smaller than N
(which is common for a band with a sparse setlist.fm page), "last 60 shows"
quietly becomes "every kept show we have, ever."

## Cola, traced through it

Pulled live via `scripts/predict.mjs "Cola"` (100 raw setlists,
`SETLIST_API_KEY` from `apps/web/.env.local`). Trimmed to the shape that
matters:

| date range | shows | tourName | quality |
|---|---|---|---|
| 2026-06-10 → 2026-07-22 | 14 raw / **12 kept** | *(none)* | current run |
| 2025-06-14 → 2025-07-19 | 5 raw / 4 kept | *(none)* | previous run |
| 2025-05-28 → 2025-06-12 | 8 raw / **3 kept** | "CAMCHUAIRT NA hÉIREANN - ALL IRELAND TOUR" | Ireland tour |
| 2022-09 → 2024-11 | rest | *(none)* | older, sparser |

Total kept shows across the whole fetched history: **42**, oldest
2022-09-18. Only 8 raw shows in Cola's *entire* page have ever been tagged
with a tour name, and only 3 of those survive the quality filter.

Walking the flow:

1. `assessQuality` keeps 42 shows total (2022–2026), drops 56 empty/short listings.
2. `selectLatestTour` sorts newest→oldest and looks for the first
   tour-tagged show. It skips past all 12 kept shows from Jun–Jul 2026
   (untagged) and all 4 from summer 2025 (also untagged), and lands on
   **2025-06-12** — the Ireland tour — a full year stale.
3. That tour has only 3 kept shows. `3 < minTourSample (8)` → "thin."
4. Fallback: last 60 kept shows. But there are only 42 kept shows in
   Cola's *entire history*, so "widen to 60" resolves to "use everything
   back to 2022."
5. Result (what the CLI actually returned): **42 shows, 2022-09-18 →
   2026-07-22, confidence MEDIUM** — the 12 real, current, tightly-clustered
   2026 shows get diluted 1:2.5 with three-year-old data.

## Root cause

The algorithm's *only* concept of "the artist's current era" is a named
tour tag. Setlist.fm tour tagging is crowdsourced and inconsistent —
plenty of real, active touring (DIY/smaller acts especially) never gets a
tour name at all. When the newest tour tag is stale or thin, the fallback
has no notion of *recency* either — it just grabs the N most recent kept
shows by count, with no ceiling on how far back in time that reaches.

Worth noting: the gap between Cola's shows makes an untagged "this is
obviously one touring run" cluster easy to see by eye —
2026-06-10→2026-07-22 has no gap wider than 21 days, then a **326-day**
gap back to the previous show. The tagged Ireland tour and the following
month's untagged shows are only ~2 days apart, too — they're plausibly the
*same* touring era, just partially tagged. A date-gap-based view of the
data would get this right without ever needing a tour name.

## The fix (2026-09-11) — `selectRecentRun`

`selectAuto` no longer starts from the newest *tag*; it starts from the
newest *show* and builds the current era by date:

```
selectRecentRun(kept shows, maxGapDays = 60)
  sort newest → oldest, start the run with the newest show
  for each older show:
    gap ≤ 60 days                 → join the run (tag irrelevant)
    gap > 60 days:
      run has no tag (label null) → run ends
      run has a label             → look past the gap, skipping a SHORT
                                    stretch of untagged one-offs (≤ 60 days
                                    wide); if the next tagged show carries
                                    the same label, bridge (one-offs ride
                                    along); anything else → run ends
  label = newest non-null tag in the run
  strategy = "latest-tour" if labelled, "recent-run" if not
```

Everything after that is unchanged in shape: run ≥ `minTourSample` (8) →
`coverageShare` → healthy or high-rotation; run < 8 → widen to last-N.
Signals were renamed to match (`healthy-recent-run`, `thin-recent-run`,
`high-rotation` — all carry `tourName: string | null`).

Cola after the fix: **recent-run, 12 shows, 2026-06-10 → 2026-07-22,
confidence HIGH.** Metallica's M72 still comes back as one run (96 shows —
the 93 tagged ones plus three untagged specials that fall inside the
tour's span). Oasis, U2, Phish, Talking Heads: unchanged decisions.

Parked follow-up (see ROADMAP §0.0): the widen path is still a blunt blend
with no comparison between the thin recent run and the older material.
