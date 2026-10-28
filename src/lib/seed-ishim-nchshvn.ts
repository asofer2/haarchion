import rowsJson from "@/data/nchshvn.json";
import { assignBillingOrders } from "./credit-order";
import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import {
  ISHIM_CLASSIC_SOURCE,
  ishimWaybackPersonUrl,
} from "./ishim-import";
import { portrait } from "./portrait";
import type {
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
} from "./types";

const NOW = "2026-10-28T00:00:00.000Z";
export const NCHSHVN_ID = "ishim-nchshvn";

const WAYBACK_URL =
  "https://web.archive.org/web/20200630064759/https://www.ishim.co.il/m.php?s=%D7%A0%D7%97%D7%A9%D7%95%D7%9F";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

const PRODUCTION: Production = {
  id: NCHSHVN_ID,
  title: rowsJson.title,
  originalTitle: rowsJson.originalTitle,
  year: rowsJson.year,
  kind: "series_dubbed_foreign",
  summary: rowsJson.summary,
  genres: rowsJson.genres,
  channel: rowsJson.channel,
  runtimeMinutes: rowsJson.runtimeMinutes,
  episodeCount: rowsJson.episodeCount,
  ishimKeys: rowsJson.ishimKeys,
  ishimNotes: rowsJson.ishimNotes,
  ishimClassic: true,
  imageUrl: portrait(rowsJson.title, rowsJson.originalTitle),
  entryAuthors: rowsJson.entryAuthors,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: WAYBACK_URL,
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
    activities: ["series", "dubbing"],
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

/** Classic ishim production page for נחשון (Wayback 2020-06-30). */
export function applyIshimNchshvn(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const p = productions[i];
    const match =
      p.id === NCHSHVN_ID ||
      (p.title === rowsJson.title && p.year === rowsJson.year);
    if (!match) continue;
    if (p.id !== NCHSHVN_ID) duplicateIds.add(p.id);
    productions[i] = {
      ...p,
      ...PRODUCTION,
      id: NCHSHVN_ID,
      imageUrl: p.imageUrl || PRODUCTION.imageUrl,
      createdAt: p.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((p) => p.id === NCHSHVN_ID)) {
    productions.push(PRODUCTION);
  }

  const keptProductions = productions.filter(
    (p) =>
      p.id === NCHSHVN_ID ||
      !(p.title === rowsJson.title && p.year === rowsJson.year)
  );

  const people = [...data.people];
  const byId = new Map(people.map((p) => [p.id, p]));
  const byName = new Map(
    people.map((p) => [normalizePersonName(p.name), p] as const)
  );
  for (const p of people) {
    for (const nick of p.nicknames || []) {
      const k = normalizePersonName(nick);
      if (!k || byName.has(k)) continue;
      byName.set(k, p);
    }
  }

  const credits: Credit[] = assignBillingOrders(
    (rowsJson.credits as CreditRow[]).map((row) => ({
      personId: resolvePersonId(row.personName, people, byName, byId),
      productionId: NCHSHVN_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: rowsJson.year,
    }))
  );

  const mergedCredits = [
    ...data.credits.filter(
      (c) =>
        c.productionId !== NCHSHVN_ID && !duplicateIds.has(c.productionId)
    ),
    ...credits,
  ];

  return {
    ...data,
    people,
    productions: keptProductions,
    credits: mergedCredits,
  };
}
