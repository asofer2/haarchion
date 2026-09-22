import { creditDedupeKey, preferCreditCharacter } from "./credit-order";
import type { ArchiveData, Person, Production } from "./types";

function textLen(value?: string): number {
  return (value || "").trim().length;
}

/** Prefer non-empty / longer prose; never replace real text with blank. */
function preferText(primary?: string, fallback?: string): string {
  const a = (primary || "").trim();
  const b = (fallback || "").trim();
  if (a.length >= b.length) return primary || fallback || "";
  return fallback || primary || "";
}

/**
 * Keep any existing image. Overlay wins only when it has a real URL;
 * never overwrite a seed/Storage portrait with empty/missing image.
 */
export function preferImageUrl(
  overlay?: string,
  base?: string
): string | undefined {
  const c = overlay?.trim();
  if (c) return overlay;
  const s = base?.trim();
  if (s) return base;
  return undefined;
}

function notesWeight(
  notes?: { heading: string; items: string[] }[]
): number {
  if (!notes?.length) return 0;
  return notes.reduce((n, block) => n + (block.items?.length || 0), 0);
}

function preferNotes(
  overlay?: { heading: string; items: string[] }[],
  base?: { heading: string; items: string[] }[]
) {
  return notesWeight(overlay) >= notesWeight(base)
    ? overlay || base
    : base || overlay;
}

/** Merge person records: fill empties from base, never drop imageUrl. */
export function mergePersonRecords(base: Person, overlay: Person): Person {
  return {
    ...base,
    ...overlay,
    name: overlay.name?.trim() || base.name,
    nameOriginal: overlay.nameOriginal || base.nameOriginal,
    birthDate: overlay.birthDate || base.birthDate,
    deathDate: overlay.deathDate || base.deathDate,
    nicknames: [
      ...new Set([...(base.nicknames || []), ...(overlay.nicknames || [])]),
    ],
    tags: [...new Set([...(base.tags || []), ...(overlay.tags || [])])],
    activities: [
      ...new Set([...(base.activities || []), ...(overlay.activities || [])]),
    ],
    bio: preferText(overlay.bio, base.bio),
    ishimNotes: preferNotes(overlay.ishimNotes, base.ishimNotes),
    imageUrl: preferImageUrl(overlay.imageUrl, base.imageUrl),
    wikipediaUrl: overlay.wikipediaUrl || base.wikipediaUrl,
    discography:
      overlay.discography?.length ? overlay.discography : base.discography,
    ishimClassic: Boolean(base.ishimClassic || overlay.ishimClassic),
    entryAuthors: overlay.entryAuthors?.length
      ? overlay.entryAuthors
      : base.entryAuthors,
    sourceNote: overlay.sourceNote || base.sourceNote,
    sourceUrl: overlay.sourceUrl || base.sourceUrl,
    gender: overlay.gender || base.gender,
    imageSource: overlay.imageSource || base.imageSource,
    imageCachedAt: overlay.imageCachedAt || base.imageCachedAt,
    createdAt: base.createdAt || overlay.createdAt,
    updatedAt:
      (overlay.updatedAt || "") > (base.updatedAt || "")
        ? overlay.updatedAt
        : base.updatedAt,
    createdBy: overlay.createdBy || base.createdBy,
    updatedBy: overlay.updatedBy || base.updatedBy,
  };
}

/** Merge production records: fill empties from base, never drop imageUrl. */
export function mergeProductionRecords(
  base: Production,
  overlay: Production
): Production {
  return {
    ...base,
    ...overlay,
    title: overlay.title?.trim() || base.title,
    originalTitle: overlay.originalTitle || base.originalTitle,
    summary: preferText(overlay.summary, base.summary),
    genres: [...new Set([...(base.genres || []), ...(overlay.genres || [])])],
    channel: overlay.channel || base.channel,
    studio: overlay.studio || base.studio,
    dubbingStudio: overlay.dubbingStudio || base.dubbingStudio,
    imageUrl: preferImageUrl(overlay.imageUrl, base.imageUrl),
    ishimNotes: preferNotes(overlay.ishimNotes, base.ishimNotes),
    ishimKeys: [
      ...new Set([...(base.ishimKeys || []), ...(overlay.ishimKeys || [])]),
    ],
    ishimClassic: Boolean(base.ishimClassic || overlay.ishimClassic),
    entryAuthors: overlay.entryAuthors?.length
      ? overlay.entryAuthors
      : base.entryAuthors,
    sourceNote: overlay.sourceNote || base.sourceNote,
    sourceUrl: overlay.sourceUrl || base.sourceUrl,
    imageSource: overlay.imageSource || base.imageSource,
    imageCachedAt: overlay.imageCachedAt || base.imageCachedAt,
    endYear: overlay.endYear ?? base.endYear,
    airStatus: overlay.airStatus ?? base.airStatus,
    runtimeMinutes: overlay.runtimeMinutes ?? base.runtimeMinutes,
    episodeCount: overlay.episodeCount ?? base.episodeCount,
    createdAt: base.createdAt || overlay.createdAt,
    updatedAt:
      (overlay.updatedAt || "") > (base.updatedAt || "")
        ? overlay.updatedAt
        : base.updatedAt,
    createdBy: overlay.createdBy || base.createdBy,
    updatedBy: overlay.updatedBy || base.updatedBy,
  };
}

/**
 * Rebuild the live archive from the full ishim-backed seed, then overlay
 * Firestore docs. Empty cloud stubs get filled from seed; existing imageUrl
 * values are never replaced with blanks.
 */
export function mergeCloudOntoFullSeed(
  cloud: ArchiveData,
  fullSeed: ArchiveData
): ArchiveData {
  const people = new Map(fullSeed.people.map((p) => [p.id, p]));
  for (const person of cloud.people || []) {
    const existing = people.get(person.id);
    people.set(
      person.id,
      existing ? mergePersonRecords(existing, person) : person
    );
  }

  const productions = new Map(fullSeed.productions.map((p) => [p.id, p]));
  for (const production of cloud.productions || []) {
    const existing = productions.get(production.id);
    productions.set(
      production.id,
      existing ? mergeProductionRecords(existing, production) : production
    );
  }

  const credits = new Map(
    fullSeed.credits.map((c) => [creditDedupeKey(c), c])
  );
  for (const credit of cloud.credits || []) {
    const key = creditDedupeKey(credit);
    const existing = credits.get(key);
    if (!existing) {
      credits.set(key, credit);
      continue;
    }
    const personName =
      people.get(credit.personId)?.name ||
      people.get(existing.personId)?.name;
    credits.set(key, preferCreditCharacter(existing, credit, personName));
  }

  return {
    people: [...people.values()],
    productions: [...productions.values()],
    credits: [...credits.values()],
    contributions: cloud.contributions || [],
  };
}

/** Count people/productions that look empty (no prose + no credits). */
export function countEmptyContent(data: ArchiveData): {
  emptyPeople: number;
  emptyProductions: number;
  peopleMissingProse: number;
  productionsMissingSummary: number;
  peopleZeroCredits: number;
  productionsZeroCredits: number;
  sampleEmptyPersonIds: string[];
  sampleEmptyProductionIds: string[];
} {
  const creditsByPerson = new Map<string, number>();
  const creditsByProd = new Map<string, number>();
  for (const c of data.credits) {
    creditsByPerson.set(c.personId, (creditsByPerson.get(c.personId) || 0) + 1);
    creditsByProd.set(
      c.productionId,
      (creditsByProd.get(c.productionId) || 0) + 1
    );
  }

  let emptyPeople = 0;
  let peopleMissingProse = 0;
  let peopleZeroCredits = 0;
  const sampleEmptyPersonIds: string[] = [];

  for (const p of data.people) {
    const prose =
      textLen(p.bio) > 0 || notesWeight(p.ishimNotes) > 0;
    const creditCount = creditsByPerson.get(p.id) || 0;
    if (!prose) peopleMissingProse++;
    if (!creditCount) peopleZeroCredits++;
    if (!prose && !creditCount) {
      emptyPeople++;
      if (sampleEmptyPersonIds.length < 12) sampleEmptyPersonIds.push(p.id);
    }
  }

  let emptyProductions = 0;
  let productionsMissingSummary = 0;
  let productionsZeroCredits = 0;
  const sampleEmptyProductionIds: string[] = [];

  for (const p of data.productions) {
    const summary = textLen(p.summary) > 0;
    const creditCount = creditsByProd.get(p.id) || 0;
    if (!summary) productionsMissingSummary++;
    if (!creditCount) productionsZeroCredits++;
    if (!summary && !creditCount) {
      emptyProductions++;
      if (sampleEmptyProductionIds.length < 12) {
        sampleEmptyProductionIds.push(p.id);
      }
    }
  }

  return {
    emptyPeople,
    emptyProductions,
    peopleMissingProse,
    productionsMissingSummary,
    peopleZeroCredits,
    productionsZeroCredits,
    sampleEmptyPersonIds,
    sampleEmptyProductionIds,
  };
}
