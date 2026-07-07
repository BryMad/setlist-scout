import acl from "@/data/festivals/acl-2026.json";
import lollapalooza from "@/data/festivals/lollapalooza-2026.json";
import outsideLands from "@/data/festivals/outside-lands-2026.json";

/* Curated festival lineups (roadmap §0, P1). Lineups are public posters —
   these files are hand-maintained. This module is the FestivalSource seam:
   swap in MusicBrainz Events later without the UI noticing. */

export interface FestivalAct {
  name: string;
  tier?: string; // "headliner" | undefined
  day?: string; // future: day filters when the data has them
}

export interface Festival {
  slug: string;
  name: string;
  year: number;
  dates: string;
  location: string;
  lineup: FestivalAct[];
}

export const FESTIVALS: Festival[] = [
  lollapalooza as Festival,
  outsideLands as Festival,
  acl as Festival,
];

export function getFestival(slug: string): Festival | undefined {
  return FESTIVALS.find((festival) => festival.slug === slug);
}
