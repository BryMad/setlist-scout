# SetlistScout v2 — Roadmap

Ideas parked here so they don't get lost. Not a commitment or an order of work —
the point is that each idea is written down with enough context to pick it up later.

---

## 0. TOP PRIORITY — Info/About page + login state in the nav

Port the v1 site's informational surface and make auth visible:

1. **About/info page** (`/about`): what the site does and how it works —
   prediction from setlist.fm data, Spotify matching, the confidence bands —
   plus data-source credits and the not-affiliated-with-Spotify disclaimer.
   Port v1's About copy as the base, update for v2's mechanics. Link it from
   the header and/or footer. (Privacy/Terms/EUA are already live at `/legal`,
   ported verbatim — but the §6 note stands: privacy copy still describes
   v1's 24-hour sessions and needs a v2 pass — fold that into this work.)
2. **Spotify login/logout in the nav bar** (v1 parity): header shows
   "Log in with Spotify" when signed out; when signed in, show state +
   a logout control. Mechanics: the `sp_session` cookie is HttpOnly, so the
   header needs a tiny `/api/me` status endpoint (client fetch on mount) and
   a `/auth/logout` that clears the cookie — per the EUA promise, logging
   out removes the user's data from our side.

---

## 0.1. IN FLIGHT — Festival playlists (feature-flagged OFF)

**Dark-shipped behind `ENABLE_FESTIVALS`** (v1 tradition): all routes
(/festivals, /festival/*, both APIs), the home-page link, and the weekly
cron 404/no-op unless the env var is set. Dev has it on in .env.local;
flip it on in the Vercel dashboard when it's ready for the public.

**The product:** pick a festival (Coachella, Lollapalooza, Glastonbury…) →
see this year's lineup → choose what kind of playlist you want → one click,
one Spotify playlist. It serves three people at once: "which bands should I
check out?", "which sets do I want to see?", and "I picked my bands — what
will they play?" (each lineup row links to the artist's full predict page).

**Implementation sketch:**

1. **Lineup source — Wikipedia via `scripts/festival-refresh.mjs`** (built
   2026-07-07). Wikipedia maintains full festival lineups in parseable
   wikitext soon after announcement ("List of X lineups by year" articles,
   or whole year-articles like "Coachella 2026") — including days. The
   script maps festival → article/section/block, parses `{{hlist}}` +
   bullets, writes `data/festivals/<slug>.draft.json` for review;
   `--promote` merges into the live file preserving our headliner tiers.
   Rerun whenever lineups update; add a festival = one registry entry.
   Sources that FAILED live testing (2026-07-07), don't re-litigate:
   MusicBrainz Events (2026 majors mostly absent; existing events incl.
   Coachella 2024/2026 have ZERO artist relations), Music Festival Wizard
   (Cloudflare-walled), Songkick/Bandsintown (partner-gated), Clashfinder
   (account-gated JSON, UK-skewed, fills at set-times not announcement).
   Untested option if ever needed: Ticketmaster Discovery API (free key,
   events carry "attractions"). Gaps (e.g. Outside Lands 2026 not on
   Wikipedia yet) fall back to hand-curated JSON from news searches.

2. **Routes.** `/festivals` (index of curated festivals, entry point linked
   from the home page) → `/festival/[slug]` (lineup + playlist builder).
   No SectionNav — festivals are an artist-less entry path.

3. **Resolution + prediction, per artist, progressively.** A 90-act lineup
   can't be predicted in one 60s serverless request on a cold cache. The
   lineup page renders instantly, then the client hydrates each artist in
   parallel via one small endpoint per artist (name → existing Spotify
   search → mbid resolve with incarnation pruning → `getShows` recent-100 →
   `predict` auto → top songs). Every step already exists and is
   Redis-cached individually, so the second visitor gets the whole festival
   instantly. Unresolvable lineup names render as "couldn't match" and are
   skippable, never fatal.

4. **Choose-ability (the playlist options):**
   - **Depth per artist:** "1 song — the lock" / "top 3" / "top 5" /
     "everything likely" (≥40%).
   - **Artist selection:** checkboxes on the lineup (default all), plus
     day filters when lineup data has days.
   - Playlist grouped by artist in lineup order; name like
     "Coachella 2026 — Setlist Scout".
   - Save via existing `/api/playlist` (already chunks 100 uris per call).

5. **Guardrails.** Keep the single `playlist-modify-public` scope — no
   listening-history scopes for "personalized" lineup ranking; if we ever
   want "sort by what you'd like," use Spotify popularity, not user data.
   Track-match budget: matching only the chosen depth per artist keeps
   Spotify API usage proportional to the playlist, not the festival.

**Shipped so far (2026-07-07):** P1 builder + per-artist pipeline; full
Wikipedia lineups (Lolla 172 / Coachella 168 / ACL 123 / Primavera 49;
Outside Lands stays hand-curated until Wikipedia has it); depth options
reworked to "Top 3 / Top 10 / Everything recent" (everything = every song
in the artist's auto-selected prediction window, capped 40/artist).

**Store & refresh process (shipped):** three layers, all automatic —
1. *Festivals:* repo seed JSONs (from `scripts/festival-refresh.mjs`) +
   Redis override written weekly by `/api/cron/refresh-festivals`
   (vercel.json cron, Mon 06:00 UTC; set `CRON_SECRET` env in Vercel).
   A failed parse keeps the previous lineup — never blanks a festival.
2. *Artists:* per-act DTO (resolve→predict→match) cached in Redis 7 days
   (`v2:festartist2:`), refreshed lazily on first visit after expiry.
3. *Playlists:* assembled client-side from the cached artist DTOs — nothing
   extra to store; track matches themselves cache 90 days.

**Directory + lazy discovery (shipped 2026-07-07):** exhaustive coverage
without bulk crawling —
- *Upcoming only:* search results and the featured list both filter to
  festivals that haven't ended (registry entries carry `endsOn`; directory
  entries use MB dates). Past editions stay reachable by direct URL.
- *Search any festival:* live MusicBrainz typeahead on /festivals
  (`/api/festivals/search`, query-cached 7d; year-scoped query first so
  current editions beat the 100+ per-day/stage sub-events; sub-events
  filtered; upcoming editions sorted first). MB knows ~1,265 festivals
  for 2026 even though its lineups are empty.
- *Lineup on first visit:* opening `/festival/mb-<mbid>` runs Wikipedia
  discovery (exact-title guesses + Wikipedia search fallback — that's how
  MB's formal "Coachella Valley Music and Arts Festival 2026" resolves to
  the "Coachella 2026" article, verified: 168 acts in ~10s) and stores the
  result 60d. No lineup found → honest "not announced yet" page + 7d
  retry marker. Edition year derives from the MB entry itself, so past
  editions discover their own year.
- *Interest-driven refresh:* every festival page open increments
  `v2:fest:interest`; the weekly cron re-discovers only the top-15
  most-opened directory festivals (+ the featured registry). Nobody
  searching = no calls spent.

**Next:** day filters on the builder (Lolla data already has days);
pre-warm cron for lineup artists (spread batches to respect serverless
budget); location/country display for directory festivals (MB has place
rels — one extra lookup); prose-recap festivals need hand curation
(Governors Ball, Osheaga, Shaky Knees).
P3 = discovery aids (sort lineup by likelihood confidence, popularity).

---

## 0.5. QUEUED — Predict-page stats HUD

A compact data widget on the Predict view — glanceable by default, clickable
to go deeper. Aesthetic reference: the lab's "Telemetry" skin, translated
into the site's quiet Geist language (this is where the "nerdy data
presentation" energy gets to live).

**Default panel (no interaction):** three stat tiles —
- **Likely encore** — song(s) with the highest encoreRate × likelihood
- **Most played** — the top likelihood song (with plays/shows count)
- **Usual opener** — highest openerRate song

**Click to flip panels:**
- **By album** — which albums dominate the current setlists: share of the
  analyzed window per album as a bar/donut breakdown. Album names come free
  from the Spotify matches we already fetch (match.album on the top 60).
- Later candidates: era/decade split, cover count, "due" songs (gap stat
  from §3) — the HUD is the natural home for those.

**Layout:** the page is max-w-3xl; on xl screens the HUD sits as a sticky
side widget (page grows a second column), on mobile it's a collapsible card
between the confidence panel and the legend.

**Engine prerequisite (shared with §1):** the normalizer currently flattens
set structure away. Keeping `setIndex` / `isEncore` / `positionInShow` per
song and computing per-song position stats (openerRate, closerRate,
encoreRate) is exactly the prerequisite §1 (true predicted setlist) needs —
building the HUD first ships user value while laying §1's foundation.
Album shares need no engine work (pure aggregation over existing matches).

---

## 0.6. QUEUED — Prefer live versions + real live recordings in Relive

Two related features, one theme: Spotify is full of live recordings and we
currently ignore them.

**A. "Prefer live versions" toggle (site-wide).** Anywhere tracks get
matched (predict, tour, show, festival playlists), a toggle switches the
matcher to prefer live recordings: query variants with "live", candidates
whose track/album title says live get boosted instead of penalized, studio
version as fallback when no live cut exists. Implementation notes: the
match cache key must include the preference (new namespace, e.g.
`v2:track3:live:` vs `v2:track3:studio:`) so the two modes never collide;
toggle state can live in a cookie or query param and flows into
`matchTracks`. Playlist save then simply uses whatever's matched.

**B. Hoist actual live recordings in Relive.** When a tour (or single show)
is picked, search Spotify's *albums* for real live releases from that era —
Grateful Dead date-named shows are the canonical case; official live albums
(e.g. U2's Sphere releases) also qualify. Sketch: album search on the
artist (queries: tour name, "live" + tour years, exact date for show
pages), filter by release date within/near the tour window + "live"
signals in the title, rank by name/date proximity. When found, promote a
card at the top: "This tour has a real live recording on Spotify" → links
to the album (and playlist-from-album as an option). Show pages try the
exact date first ("1977-05-08"). Cache per artist+era in Redis. False
positives are the risk (greatest-hits "live" compilations) — be
conservative, require date or tour-name corroboration.

---

## 0.7. QUEUED — Apple Music support (full parity)

Everything the Spotify integration does, for Apple Music: login, track
matching with art/albums, and playlist creation — user picks their service.

**Architecture:** extract a `MusicService` interface from the Spotify
client (searchArtists, matchSongs, createPlaylist, auth/session) with
Spotify + Apple implementations. UI grows a provider choice at the save
button ("Save to Spotify / Save to Apple Music") and provider-correct
attribution everywhere the canonical rows render (Apple has its own badge
and metadata display guidelines, like Spotify's).

**Apple specifics to plan around:**
- Requires Apple Developer Program ($99/yr) + a MusicKit key; the server
  signs developer tokens (ES256 JWT), unlike Spotify's client-credentials.
- User auth is MusicKit JS in the browser (yields a Music-User-Token) —
  a different shape from the OAuth redirect flow; session storage stays
  cookie-based but the login UX differs.
- Catalog search + playlist creation via the Apple Music API
  (`/v1/catalog/{storefront}/search`, `/v1/me/library/playlists`);
  storefront must follow the user's country.
- Users need an active Apple Music subscription for library writes.
- Legal/consent copy currently names Spotify specifically — the consent
  gate, EUA/privacy summaries, and footer attribution all need
  provider-aware updates before launch.

---

## 0b. DONE 2026-07-07 — Relive-a-set optionality + show search ✓

Shipped: tour page view pills ("What they played" / "Pick a show", URL param
`?view=shows`, Spotify matching only runs in the played view); tours page
search box filtering all shows by city/venue/date/tour (multi-term AND,
"sydney 2019" works), surfacing matching tours and individual nights; same
filter scoped to the tour's shows in the pick-a-show view. All client-side
filters over server-loaded data (components/ShowCards.tsx) — no new
endpoints. Note: an artist with a huge history ships a ~250KB (pre-gzip)
tours page payload for the show index; revisit if it ever matters.

---

## 0c. DONE 2026-07-05 — Vercel deploy ✓

Live at https://setlist-scout-web.vercel.app (repo `BryMad/setlist-scout`,
root dir `apps/web`, branch `main`, push-to-deploy). Spotify redirect URI
updated; login + playlist save verified in prod. The name `setlist-scout`
was taken on vercel.app by an unrelated app — remaining step: **buy the real
domain** (setlistscout.com / .app via Vercel Domains), then update
`SPOTIFY_REDIRECT_URI` env + Spotify dashboard to match, and do the
real-device phone pass. Old site stays on Render until cutover.

---

## 1. True predicted setlist (the big one)

**The tension:** today's "Predict my set" doesn't predict a *set* — it ranks songs
by likelihood. A real predicted setlist has an opener, a body with an arc, and an
epic encore, in order. setlist.fm shows an "average setlist" on their site, but it
is **not exposed in the API** — we'd build our own, and can do better.

**Prerequisite (engine):** the normalizer currently flattens away set structure.
`setlistSchema` already captures `sets.set[].encore` and set names — `toShow()`
drops them. First step is keeping per-song position context: `setIndex`,
`isEncore`, `positionInShow` (0..1 percentile).

**Per-song position stats** (computed across the selected window):
- `openerRate` — how often it's song #1
- `closerRate` — how often it ends the main set
- `encoreRate` — how often it appears in an encore (the "epic encore" signal:
  high encoreRate + high likelihood = the traditional closer)
- `meanPosition` — average position percentile when played
- adjacency (which songs tend to follow which) — stretch goal, enables
  segue-aware ordering for jam bands

**Assembly algorithm (sketch):**
1. Target length = median performed-song count for the window.
2. Slot the opener (highest openerRate among near-lock songs).
3. Slot encore block last (rank by encoreRate × likelihood).
4. Fill the body with the remaining top-likelihood songs, ordered by meanPosition.
5. Confidence per-slot, not just per-song ("the opener is 90% certain; slots 8–12
   are a coin flip").

**Validation (fixture-driven, same as everything else):** backtest — predict show
N from shows 1..N-1, score song overlap + order correlation (Kendall tau) against
what was actually played. Tune weights against the fixtures.

**Product placement:** a view toggle inside the predict tab — "Ranked by
likelihood" (default, today's view) vs "As a setlist (beta)". The ranked list
never goes away; it's the cram tool.

---

## 2. Restore the likelihood spectrum (from v1)

v1 color-coded likelihood and it communicated "this is a ranking of odds" better
than anything else on the page. Old spec (Track.jsx):

| Likelihood | Color  | Label       |
|-----------|--------|-------------|
| ≥ 80%     | purple | Very Likely |
| ≥ 60%     | blue   | Likely      |
| ≥ 40%     | yellow | Possible    |
| ≥ 20%     | orange | Rare        |
| < 20%     | red    | Very Rare   |

v2 version: tint the percentage + bar per band (bars are currently uniform
indigo), keep the text labels so color is never the only signal (a11y), tune hues
against the dark surface. The cool→hot spectrum is the product story: cool colors
= locks, hot colors = deep-cut lottery tickets.

---

## 2b. Spotify-guideline gaps in the track rows

- ~~**"Open Spotify" button per track**~~ — shipped 2026-07: green "OPEN
  SPOTIFY" pill on every matched row (SongList), muted "NO MATCH" pill when
  Spotify definitively had no match, nothing for songs beyond the match budget.

## 2c. Spectrum palette cleanup

- The v1-inherited five colors (violet/sky/yellow/orange/rose) clash against
  the quiet Geist chrome. Redesign as a cleaner, gradient-coherent ramp once
  the main design settles — fewer hues, ordered lightness, validated against
  the dark surface. Keep the five labels; they're the product story.

## 3. Cram-mode features

- **Gap stat for rotation artists** — "last played 14 shows ago." Jam-band fans
  track song gaps religiously; a "due" indicator makes the Phish/Pearl Jam view
  much smarter than raw frequency.
- **Playlist options** — size choice (top N), and later: order by predicted-set
  order instead of likelihood order.
- **Song-count context** — "they play ~24 songs a night" belongs near the top of
  the ranked list, so "top 24" reads as "the likely show."

---

## 4. UX debt (small, known)

- Auto-resume the playlist save after the OAuth round-trip (currently two clicks).
- Visible error message on auth failure (`/?auth=failed` is silent).
- Show page → back-link to its tour (pass artist mbid through the link).
- Live crawl progress in the UI — the client already emits `onProgress`
  ("page 40 of 94"); the tours loading screen shows a static spinner.
- Thumbnail fade-in to soften late-loading art.
- Mobile layout pass.

---

## 5. Data & engine

- More fixture artists: a festival-circuit act, a DJ/electronic act, an artist
  mid-tour *right now*, an artist with same-name collisions.
- Combined incarnation view — "Neil Young (all lineups)" merged analysis as an
  option alongside the per-incarnation pages.
- Same-name disambiguation, further rungs (dominance pruning + disambiguation
  text shipped 2026-07): cross-check the clicked Spotify artist's
  popularity/genres against setlist.fm candidates; full MusicBrainz linkage
  (Spotify URL → MBID) as the definitive resolver; a "wrong artist?" escape
  hatch on artist pages so pruning can never trap anyone.

---

## 6. Production readiness

- **Vercel deploy** (decided 2026-07 — v2 has no SSE and no server-held
  sessions, so serverless fits): import repo, Root Directory
  `v2/apps/web`, copy env vars, add the prod redirect URI in the Spotify
  dashboard (`https://<domain>/auth/callback`), custom domain. Old site stays
  on Render until cutover; Redis Cloud serves both.
- Serverless hardening: move the setlist.fm rate limiter into Redis (the
  in-process limiter is per-invocation on Vercel — fine at small scale,
  wrong at large).
- Redis quota watch — gzip is in place (~18× smaller); consider an LRU cap if the
  shared instance gets tight.
- Port Privacy / Terms / EUA consent flow from the old site (Spotify integration
  requirement).
- Rewrite README + CLAUDE.md for the v2 architecture.
- Domain cutover; retire old frontend/backend.

---

## Decided against (for now)

- **Frozen `/results/{id}` snapshot permalinks** — v2 URLs are recipes (mbid +
  mode), permanent and always-fresh by design. Revisit only if users demand
  "exactly what I saw" sharing.
- **Scraping setlist.fm HTML** — abandoned in v1 once the elevated API rate limit
  made full-history crawls feasible; v2 stays API-only.
