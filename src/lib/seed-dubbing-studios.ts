import type { Production } from "./types";

const ALROM = "אולפני אלרום";
const VIDEO = "אולפני וידאופילם אינטרנשיונל";
const AZ = "סרטי אז";

/** Known Hebrew dubbing studios by production id */
export const DUBBING_STUDIO_BY_ID: Record<string, string> = {
  // Seed classic / educational
  "the-smurfs-he": AZ,
  "care-bears-he": AZ,
  "the-heart-marco": AZ,
  "danny-phantom-style-danny": AZ,
  "jungle-book-he-1988": AZ,
  "once-upon-a-time-life": AZ,
  "ht-tymvn-vpvmbh": AZ,
  "little-mermaid-he": VIDEO,
  "lion-king-he": VIDEO,
  "aladdin-he": VIDEO,
  "digimon-he": VIDEO,

  // Wave2 Disney / Pixar / Illumination
  "frozen-he": ALROM,
  "frozen2-he": ALROM,
  "moana-he": ALROM,
  "encanto-he": ALROM,
  "coco-he": ALROM,
  "inside-out-he": ALROM,
  "toy-story-he": VIDEO,
  "toy-story-4-he": ALROM,
  "finding-nemo-he": VIDEO,
  "shrek-he": VIDEO,
  "shrek-2-he": VIDEO,
  "despicable-me-he": ALROM,
  "minions-he": ALROM,
  "zootopia-he": ALROM,
  "big-hero-6-he": ALROM,
  "tangled-he": ALROM,
  "mulan-he": VIDEO,
  "beauty-beast-he": VIDEO,
  "snow-white-he": VIDEO,
  "pocahontas-he": VIDEO,
  "hercules-he": VIDEO,
  "tarzan-he": VIDEO,
  "nemo-dory-he": ALROM,
  "incredibles-he": VIDEO,
  "up-he": ALROM,
  "spiderverse-he": ALROM,
  "super-mario-he": ALROM,
  "wish-he": ALROM,
  "elemental-he": ALROM,
  "paw-patrol-he": ALROM,
  "peppa-pig-he": ALROM,
  "spongebob-he": VIDEO,
  "pokemon-he": VIDEO,
  "naruto-he": VIDEO,
  "dragonball-he": VIDEO,
  "sailormoon-he": VIDEO,
  "totally-spies-he": VIDEO,
  "winx-he": VIDEO,
  "miraculous-he": ALROM,
  "bluey-he": ALROM,
  "ha-ilemet": VIDEO,
};

function looksDubbed(p: Production): boolean {
  if (p.dubbingStudio) return true;
  if (DUBBING_STUDIO_BY_ID[p.id]) return true;
  if (p.id.endsWith("-he") || p.id.startsWith("ht-")) return true;
  const blob = `${p.title} ${p.summary} ${(p.genres || []).join(" ")}`;
  return /מדובב|דיבוב|אנימה/.test(blob) || (p.genres || []).includes("דיבוב");
}

function guessStudio(p: Production): string {
  if (p.channel?.includes("חינוכית") || p.year < 1992) return AZ;
  if (p.year < 2009) return VIDEO;
  return ALROM;
}

function withMadubavGenre(genres: string[]): string[] {
  if (genres.includes("מדובב") || genres.includes("דיבוב")) return genres;
  return [...genres, "מדובב"];
}

/** Fill missing dubbingStudio on dubbed films/series */
export function applyDubbingStudios(productions: Production[]): Production[] {
  return productions.map((p) => {
    if (p.dubbingStudio?.trim()) {
      return { ...p, genres: withMadubavGenre(p.genres || []) };
    }
    const known = DUBBING_STUDIO_BY_ID[p.id];
    if (known) {
      return {
        ...p,
        dubbingStudio: known,
        genres: withMadubavGenre(p.genres || []),
      };
    }
    if (!looksDubbed(p)) return p;
    // Skip live musicals / festivals that aren't dubbed screen works
    if (
      p.kind === "musical" ||
      p.kind === "festival" ||
      p.kind === "performance" ||
      p.kind === "stage" ||
      p.kind === "cassette" ||
      p.kind === "cassette_kids" ||
      p.kind === "website" ||
      p.kind === "person" ||
      p.kind === "ensemble" ||
      p.kind === "radio" ||
      p.kind === "radio_program"
    ) {
      return p;
    }
    return {
      ...p,
      dubbingStudio: guessStudio(p),
      genres: withMadubavGenre(p.genres || []),
    };
  });
}
