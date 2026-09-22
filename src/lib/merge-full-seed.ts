import "server-only";

import { creditDedupeKey } from "./credit-order";
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
 * Keep any existing image. Cloud wins only when it has a real URL;
 * never overwrite a seed/Storage portrait with empty/missing cloud image.
 */
function preferImage(
  cloud?: string,
  seed?: string
): string | undefined {
  const c = cloud?.trim();
  if (c) return cloud;
  const s = seed?.trim();
  if (s) return seed;
  return undefined;
}

function notesWeight(
  notes?: { heading: string; items: string[] }[]
): number {
  if (!notes?.length) return 0;
  return notes.reduce((n, block) => n + (block.items?.length || 0), 0);
}

function preferNotes(
  cloud?: { heading: string; items: string[] }[],
  seed?: { heading: string; items: string[] }[]
) {
  return notesWeight(cloud) >= notesWeight(seed) ? cloud || seed : seed || cloud;
}

function mergePerson(seed: Person, cloud: Person): Person {
  return {
    ...seed,
    ...cloud,
    name: cloud.name?.trim() || seed.name,
    nameOriginal: cloud.nameOriginal || seed.nameOriginal,
    birthDate: cloud.birthDate || seed.birthDate,
    deathDate: cloud.deathDate || seed.deathDate,
    nicknames: [
      ...new Set([...(seed.nicknames || []), ...(cloud.nicknames || [])]),
    ],
    tags: [...new Set([...(seed.tags || []), ...(cloud.tags || [])])],
    activities: [
      ...new Set([...(seed.activities || []), ...(cloud.activities || [])]),
    ],
    bio: preferText(cloud.bio, seed.bio),
    ishimNotes: preferNotes(cloud.ishimNotes, seed.ishimNotes),
    imageUrl: preferImage(cloud.imageUrl, seed.imageUrl),
    wikipediaUrl: cloud.wikipediaUrl || seed.wikipediaUrl,
    discography:
      cloud.discography?.length ? cloud.discography : seed.discography,
    ishimClassic: Boolean(seed.ishimClassic || cloud.ishimClassic),
    entryAuthors: cloud.entryAuthors?.length
      ? cloud.entryAuthors
      : seed.entryAuthors,
    sourceNote: cloud.sourceNote || seed.sourceNote,
    sourceUrl: cloud.sourceUrl || seed.sourceUrl,
    gender: cloud.gender || seed.gender,
    imageSource: cloud.imageSource || seed.imageSource,
    imageCachedAt: cloud.imageCachedAt || seed.imageCachedAt,
    createdAt: seed.createdAt || cloud.createdAt,
    updatedAt:
      (cloud.updatedAt || "") > (seed.updatedAt || "")
        ? cloud.updatedAt
        : seed.updatedAt,
    createdBy: cloud.createdBy || seed.createdBy,
    updatedBy: cloud.updatedBy || seed.updatedBy,
  };
}

function mergeProduction(seed: Production, cloud: Production): Production {
  return {
    ...seed,
    ...cloud,
    title: cloud.title?.trim() || seed.title,
    originalTitle: cloud.originalTitle || seed.originalTitle,
    summary: preferText(cloud.summary, seed.summary),
    genres: [...new Set([...(seed.genres || []), ...(cloud.genres || [])])],
    channel: cloud.channel || seed.channel,
    studio: cloud.studio || seed.studio,
    dubbingStudio: cloud.dubbingStudio || seed.dubbingStudio,
    imageUrl: preferImage(cloud.imageUrl, seed.imageUrl),
    ishimNotes: preferNotes(cloud.ishimNotes, seed.ishimNotes),
    ishimKeys: [
      ...new Set([...(seed.ishimKeys || []), ...(cloud.ishimKeys || [])]),
    ],
    ishimClassic: Boolean(seed.ishimClassic || cloud.ishimClassic),
    entryAuthors: cloud.entryAuthors?.length
      ? cloud.entryAuthors
      : seed.entryAuthors,
    sourceNote: cloud.sourceNote || seed.sourceNote,
    sourceUrl: cloud.sourceUrl || seed.sourceUrl,
    imageSource: cloud.imageSource || seed.imageSource,
    imageCachedAt: cloud.imageCachedAt || seed.imageCachedAt,
    endYear: cloud.endYear ?? seed.endYear,
    airStatus: cloud.airStatus ?? seed.airStatus,
    runtimeMinutes: cloud.runtimeMinutes ?? seed.runtimeMinutes,
    episodeCount: cloud.episodeCount ?? seed.episodeCount,
    createdAt: seed.createdAt || cloud.createdAt,
    updatedAt:
      (cloud.updatedAt || "") > (seed.updatedAt || "")
        ? cloud.updatedAt
        : seed.updatedAt,
    createdBy: cloud.createdBy || seed.createdBy,
    updatedBy: cloud.updatedBy || seed.updatedBy,
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
    people.set(person.id, existing ? mergePerson(existing, person) : person);
  }

  const productions = new Map(fullSeed.productions.map((p) => [p.id, p]));
  for (const production of cloud.productions || []) {
    const existing = productions.get(production.id);
    productions.set(
      production.id,
      existing ? mergeProduction(existing, production) : production
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
    if (!existing.characterName && credit.characterName) {
      credits.set(key, { ...existing, ...credit });
    } else if (!existing.heading && credit.heading) {
      credits.set(key, { ...existing, heading: credit.heading });
    }
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
