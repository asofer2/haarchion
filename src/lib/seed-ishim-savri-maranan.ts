import rowsJson from "@/data/savri-maranan.json";
import { assignBillingOrders } from "./credit-order";
import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import {
  ISHIM_CLASSIC_SOURCE,
  ishimWaybackPersonUrl,
  ishimWaybackProductionUrl,
} from "./ishim-import";
import { portrait } from "./portrait";
import type {
  AirStatus,
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
} from "./types";

const NOW = "2026-09-20T00:00:00.000Z";
export const SAVRI_MARANAN_ID = "ishim-sbry-mrnn";

type CreditRow = {
  personName: string;
  personS?: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
};

const PRODUCTION: Production = {
  id: SAVRI_MARANAN_ID,
  title: rowsJson.title,
  year: rowsJson.year,
  kind: rowsJson.kind as Production["kind"],
  summary: rowsJson.summary,
  genres: rowsJson.genres,
  channel: rowsJson.channel,
  runtimeMinutes: rowsJson.runtimeMinutes,
  episodeCount: rowsJson.episodeCount,
  airStatus: rowsJson.airStatus as AirStatus,
  ishimKeys: rowsJson.ishimKeys,
  ishimNotes: rowsJson.ishimNotes,
  ishimClassic: true,
  imageUrl: portrait(rowsJson.title),
  entryAuthors: rowsJson.entryAuthors,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: ishimWaybackProductionUrl(rowsJson.title),
  createdAt: NOW,
  updatedAt: NOW,
};

function stubPerson(name: string): Person {
  return {
    id: `ishim-${slugify(name) || "person"}`,
    name,
    nicknames: [],
    bio: "",
    tags: [],
    activities: ["series", "acting"],
    ishimClassic: true,
    sourceNote: ISHIM_CLASSIC_SOURCE,
    sourceUrl: ishimWaybackPersonUrl(name),
    imageUrl: portrait(name),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function resolvePersonId(
  name: string,
  people: Person[],
  byName: Map<string, Person>,
  byId: Map<string, Person>
): string {
  const key = normalizePersonName(name);
  const existing = byName.get(key);
  if (existing) return existing.id;

  // Prefer known seed id for טוביה צפיר if present
  if (name === "טוביה צפיר" && byId.has("tuvia-tsafir")) {
    return "tuvia-tsafir";
  }

  let person = stubPerson(name);
  if (byId.has(person.id) && byId.get(person.id)!.name !== name) {
    person = { ...person, id: `${person.id}-${slugify(name).slice(0, 8)}` };
  }
  if (!byId.has(person.id)) {
    people.push(person);
    byId.set(person.id, person);
    byName.set(key, person);
  }
  return person.id;
}

/** Classic ishim production page for סברי מרנן (Wayback 2022-11-18). */
export function applyIshimSavriMaranan(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const p = productions[i];
    if (p.title !== rowsJson.title && p.id !== SAVRI_MARANAN_ID) continue;
    if (p.id !== SAVRI_MARANAN_ID) duplicateIds.add(p.id);
    productions[i] = {
      ...p,
      ...PRODUCTION,
      id: SAVRI_MARANAN_ID,
      imageUrl: p.imageUrl || PRODUCTION.imageUrl,
      createdAt: p.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((p) => p.id === SAVRI_MARANAN_ID)) {
    productions.push(PRODUCTION);
  }

  // Collapse accidental duplicate title rows (e.g. year mismatch stubs)
  const keptProductions = productions.filter(
    (p) => p.id === SAVRI_MARANAN_ID || p.title !== rowsJson.title
  );

  const people = [...data.people];
  const byId = new Map(people.map((p) => [p.id, p]));
  const byName = new Map(
    people.map((p) => [normalizePersonName(p.name), p] as const)
  );
  for (const p of people) {
    for (const nick of p.nicknames || []) {
      const k = normalizePersonName(nick);
      if (!byName.has(k)) byName.set(k, p);
    }
  }

  const credits: Credit[] = assignBillingOrders(
    (rowsJson.credits as CreditRow[]).map((row) => ({
      personId: resolvePersonId(row.personName, people, byName, byId),
      productionId: SAVRI_MARANAN_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year,
    }))
  );

  // Prefer richer character/year already on this title (e.g. person patches).
  const priorMeta = new Map<string, { characterName?: string; year?: number }>();
  for (const c of data.credits) {
    const prod = data.productions.find((p) => p.id === c.productionId);
    const isSavri =
      c.productionId === SAVRI_MARANAN_ID ||
      duplicateIds.has(c.productionId) ||
      prod?.title === rowsJson.title;
    if (!isSavri) continue;
    if (!c.characterName && c.year == null) continue;
    const keys = [`${c.personId}|${c.role}|${c.heading || ""}`, `${c.personId}|${c.role}`];
    for (const key of keys) {
      const prev = priorMeta.get(key) || {};
      priorMeta.set(key, {
        characterName: prev.characterName || c.characterName,
        year: prev.year ?? c.year,
      });
    }
  }

  const enrichedCredits = credits.map((c) => {
    const byHeading = priorMeta.get(`${c.personId}|${c.role}|${c.heading || ""}`);
    const byRole = priorMeta.get(`${c.personId}|${c.role}`);
    const meta = byHeading || byRole;
    if (!meta) return c;
    return {
      ...c,
      characterName: c.characterName || meta.characterName,
      year: c.year ?? meta.year,
    };
  });

  const mergedCredits = [
    ...data.credits.filter(
      (c) =>
        c.productionId !== SAVRI_MARANAN_ID &&
        !duplicateIds.has(c.productionId) &&
        data.productions.find((p) => p.id === c.productionId)?.title !==
          rowsJson.title
    ),
    ...enrichedCredits,
  ];

  return {
    ...data,
    people,
    productions: keptProductions,
    credits: mergedCredits,
  };
}
