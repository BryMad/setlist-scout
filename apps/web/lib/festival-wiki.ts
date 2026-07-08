/* Wikipedia festival-lineup source (roadmap §0.1). Pure module — no Next.js
   or path-alias imports — so the CLI refresh script can import it via
   node --experimental-strip-types, and the weekly cron route uses it too.

   Verified 2026-07-07: Wikipedia carries full lineups in wikitext shortly
   after announcement; article shapes vary, so each registry entry says
   where its lineup lives. Sources that failed testing are documented in
   ROADMAP.md — don't re-litigate them here. */

export interface WikiFestivalEntry {
  slug: string;
  name: string;
  year: number;
  dates: string;
  location: string;
  article: string;
  /** "section": lineup lives in a year section of a list article.
      "page": the year has its own article; lineup = the Line-up section tree. */
  kind: "section" | "page";
  /** for kind "section": the section heading to find (e.g. "2026") */
  section?: string;
  /** optional {{Hidden|<title>|...}} block inside the section (Lollapalooza
      packs every worldwide edition into one section as sibling blocks) */
  block?: string;
  /** names to tag as headliners (Wikipedia doesn't mark tiers) */
  headliners: string[];
  /** ISO date of the festival's last day — display filtering drops past editions */
  endsOn: string;
}

export const FESTIVAL_REGISTRY: WikiFestivalEntry[] = [
  {
    slug: "lollapalooza-2026",
    name: "Lollapalooza",
    year: 2026,
    dates: "Jul 30 – Aug 2, 2026",
    endsOn: "2026-08-02",
    location: "Grant Park, Chicago",
    article: "List of Lollapalooza lineups by year",
    kind: "section",
    section: "2026",
    block: "Lollapalooza Chicago 2026",
    headliners: [
      "Charli XCX",
      "Tate McRae",
      "Lorde",
      "Olivia Dean",
      "John Summit",
      "Jennie",
      "The Smashing Pumpkins",
      "The xx",
    ],
  },
  {
    slug: "acl-2026",
    name: "Austin City Limits",
    year: 2026,
    dates: "Oct 2–4 & 9–11, 2026",
    endsOn: "2026-10-11",
    location: "Zilker Park, Austin",
    article: "List of Austin City Limits lineups by year",
    kind: "section",
    section: "2026",
    headliners: [
      "Charli XCX",
      "Rüfüs Du Sol",
      "Twenty One Pilots",
      "Lorde",
      "Skrillex",
      "Kings of Leon",
      "The xx",
    ],
  },
  {
    slug: "coachella-2026",
    name: "Coachella",
    year: 2026,
    dates: "Apr 10–19, 2026",
    endsOn: "2026-04-19",
    location: "Empire Polo Club, Indio",
    article: "Coachella 2026",
    kind: "page",
    headliners: ["Sabrina Carpenter", "Justin Bieber", "Karol G", "Anyma"],
  },
  // NOT in the registry (checked 2026-07-07): Governors Ball / Osheaga /
  // Shaky Knees — their 2026 sections are prose recaps, not lineup lists
  // (parsing prose links yields partial, noisy lineups). Bonnaroo, Riot
  // Fest, EDC, Reading & Leeds, Hangout: no 2026 lineup on Wikipedia yet.
  // Re-probe when adding festivals; prose-only ones need hand curation.
  {
    slug: "primavera-2026",
    name: "Primavera Sound",
    year: 2026,
    dates: "Jun 2026",
    endsOn: "2026-06-07",
    location: "Parc del Fòrum, Barcelona",
    article: "Primavera Sound 2026",
    kind: "page",
    headliners: [],
  },
];

export interface ParsedAct {
  name: string;
  day?: string;
  tier?: string;
}

const UA = "SetlistScout/2.0 (setlistscout@gmail.com)";
const API = "https://en.wikipedia.org/w/api.php";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api(params: Record<string, string>): Promise<any> {
  const url = `${API}?${new URLSearchParams({ format: "json", redirects: "1", ...params })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`wikipedia ${res.status}`);
  return res.json();
}

/** [[A|B]] → B, [[A]] → A, strip refs/quotes/template leftovers. */
function cleanEntry(raw: string): string {
  let s = raw.trim();
  s = s.replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, "");
  s = s.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2");
  s = s.replace(/\[\[([^\]]*)\]\]/g, "$1");
  s = s.replace(/'{2,}/g, "");
  s = s.replace(/\{\{[^}]*\}\}/g, "");
  return s.replace(/\s+/g, " ").trim();
}

function plausible(s: string): boolean {
  return (
    s.length > 0 &&
    s.length < 60 &&
    !/^(Location|Dates?|Headliner|TBA|and more|Notes?)\b/i.test(s) &&
    !/^[|{}=<*#]/.test(s) &&
    !/\[\[|\]\]|\{\{/.test(s)
  );
}

/** {{hlist}} blocks (with optional weekday label before) + bulleted lines. */
export function parseActs(wikitext: string): ParsedAct[] {
  const acts = new Map<string, ParsedAct>();
  const push = (raw: string, day?: string) => {
    if (/cancell?ed|postponed/i.test(raw)) return; // "Massive Attack (cancelled)"
    const name = cleanEntry(raw); // keep parentheses — "Sunday (1994)" is a real band
    if (plausible(name) && !acts.has(name.toLowerCase()))
      acts.set(name.toLowerCase(), day ? { name, day } : { name });
  };

  const hlist = /(\b(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day\b[^{]{0,20})?\{\{hlist([\s\S]*?)\}\}/gi;
  for (const m of wikitext.matchAll(hlist)) {
    const day = m[1]?.match(/\b((?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day)\b/i)?.[1];
    // protect pipes inside [[link|label]] before splitting entries on "|"
    const body = m[2]!.replace(/\[\[([^\]|]*)\|/g, "[[$1¦");
    for (const part of body.split("\n").flatMap((line) => line.split("|"))) {
      const p = part.replace(/¦/g, "|").trim();
      if (p) push(p, day);
    }
  }

  for (const m of wikitext.matchAll(/^\*+\s*(.+)$/gm)) {
    push(m[1]!.split(/[–—]/)[0]!);
  }

  return [...acts.values()];
}

async function sectionWikitext(article: string, index: string): Promise<string> {
  const w = await api({ action: "parse", page: article, prop: "wikitext", section: index });
  return w.parse?.wikitext?.["*"] ?? "";
}

/** Fetch + parse one registry entry's lineup. Throws with a readable message
 *  when the article/section isn't there yet (e.g. lineup not announced). */
export async function fetchFestivalLineup(
  entry: WikiFestivalEntry
): Promise<{ acts: ParsedAct[]; source: string }> {
  const s = await api({ action: "parse", page: entry.article, prop: "sections" });
  if (s.error) throw new Error(`article "${entry.article}" missing (${s.error.code})`);
  const sections: Array<{ line: string; index: string; toclevel: number }> = s.parse.sections;
  const title: string = s.parse.title;

  let wikitext = "";
  let sourceDetail = "";

  if (entry.kind === "section") {
    const section = sections.find((x) => x.line.includes(entry.section!));
    if (!section) throw new Error(`no "${entry.section}" section in "${title}" yet`);
    wikitext = await sectionWikitext(entry.article, section.index);
    if (entry.block) {
      const start = wikitext.indexOf(`{{Hidden|${entry.block}`);
      if (start === -1) throw new Error(`block "${entry.block}" not found`);
      const next = wikitext.indexOf("{{Hidden|", start + 9);
      wikitext = next === -1 ? wikitext.slice(start) : wikitext.slice(start, next);
    }
    sourceDetail = `#${section.line}`;
  } else {
    // year-article: the Line-up section plus its deeper subsections (stages)
    const start = sections.findIndex((x) => /line.?up/i.test(x.line));
    if (start === -1) throw new Error(`no Line-up section in "${title}"`);
    const level = sections[start]!.toclevel;
    const parts = [await sectionWikitext(entry.article, sections[start]!.index)];
    for (let i = start + 1; i < sections.length && sections[i]!.toclevel > level; i++) {
      await sleep(300);
      parts.push(await sectionWikitext(entry.article, sections[i]!.index));
    }
    wikitext = parts.join("\n");
    sourceDetail = "#Line-up";
  }

  const acts = parseActs(wikitext);
  if (acts.length === 0) throw new Error(`section found but no acts parsed in "${title}"`);

  // tag headliners (registry-curated; Wikipedia doesn't mark tiers)
  const tiers = new Set(entry.headliners.map((h) => h.toLowerCase()));
  const tagged = acts.map((a) =>
    tiers.has(a.name.toLowerCase()) ? { ...a, tier: "headliner" } : a
  );
  tagged.sort((a, b) => (a.tier ? 0 : 1) - (b.tier ? 0 : 1));

  return { acts: tagged, source: `wikipedia:${title}${sourceDetail}` };
}

/* ── on-demand lineup discovery (directory tier 2) ─────────────────
   Given a festival's name from the MusicBrainz directory, try to find its
   lineup on Wikipedia without a registry entry: search for candidate
   articles, try each of the known shapes, accept the first parse that
   looks like a real lineup. */

const MIN_ACTS = 8; // fewer than this smells like prose links, not a lineup

/** "Primavera Sound 2026" → "Primavera Sound" */
export function baseFestivalName(eventName: string): string {
  return eventName.replace(/[,:–-]?\s*(19|20)\d\d\s*$/, "").trim();
}

export async function discoverFestivalLineup(
  eventName: string,
  year: number
): Promise<{ acts: ParsedAct[]; source: string } | null> {
  const base = baseFestivalName(eventName);

  // exact-title guesses, best-first
  const candidates: Array<{ article: string; kind: "section" | "page"; section?: string }> = [
    { article: `${base} ${year}`, kind: "page" },
    { article: `List of ${base} lineups by year`, kind: "section", section: String(year) },
    { article: `${base} festival lineups`, kind: "section", section: String(year) },
    { article: base, kind: "section", section: String(year) },
  ];

  // MB names are often formal ("Coachella Valley Music and Arts Festival")
  // while the article is colloquial ("Coachella 2026") — let Wikipedia's own
  // search close that gap, then try the hits in both shapes.
  try {
    const found = await api({
      action: "query",
      list: "search",
      srsearch: `${base} ${year}`,
      srlimit: "3",
    });
    for (const hit of found.query?.search ?? []) {
      const title: string = hit.title;
      if (candidates.some((c) => c.article === title)) continue;
      if (String(title).includes(String(year))) candidates.push({ article: title, kind: "page" });
      else candidates.push({ article: title, kind: "section", section: String(year) });
    }
  } catch {
    /* search down — exact guesses still run */
  }

  for (const candidate of candidates) {
    try {
      const entry: WikiFestivalEntry = {
        slug: "discover",
        name: base,
        year,
        dates: "",
        endsOn: "",
        location: "",
        headliners: [],
        ...candidate,
      };
      const { acts, source } = await fetchFestivalLineup(entry);
      if (acts.length >= MIN_ACTS) return { acts, source };
    } catch {
      /* try the next shape */
    }
    await sleep(400);
  }
  return null;
}
