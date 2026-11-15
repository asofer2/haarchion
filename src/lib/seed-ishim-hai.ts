import rowsJson from "@/data/hai.json";
import { assignBillingOrders } from "./credit-order";
import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import { ISHIM_CLASSIC_SOURCE, ishimWaybackPersonUrl } from "./ishim-import";
import { portrait } from "./portrait";
import type {
  AirStatus,
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
} from "./types";

const NOW = "2026-11-04T00:00:00.000Z";
export const HAI_ID = "ishim-hay";
const SOURCE_URL =
  "https://web.archive.org/web/20210518223514/https://www.ishim.co.il/m.php?s=%D7%94%D7%90%D7%99";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
  endYear?: number;
};

const PRODUCTION: Production = {
  id: HAI_ID,
  title: rowsJson.title,
  year: rowsJson.year,
  endYear: rowsJson.endYear,
  kind: "tv_series",
  airStatus: rowsJson.airStatus as AirStatus,
  summary: rowsJson.summary,
  genres: rowsJson.genres,
  channel: rowsJson.channel,
  runtimeMinutes: rowsJson.runtimeMinutes,
  episodeCount: rowsJson.episodeCount,
  ishimKeys: rowsJson.ishimKeys,
  ishimNotes: rowsJson.ishimNotes,
  ishimClassic: true,
  imageUrl: portrait(rowsJson.title),
  entryAuthors: rowsJson.entryAuthors,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: SOURCE_URL,
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

/** סדרת הטלוויזיה «האי» (2007–2010) לפי עמוד אישים בארכיון 18 במאי 2021. */
export function applyIshimHai(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const production = productions[i]!;
    const sameTitle =
      production.title === rowsJson.title &&
      (production.year === rowsJson.year || production.year === 0);
    if (production.id !== HAI_ID && !sameTitle) continue;
    if (production.id !== HAI_ID) duplicateIds.add(production.id);
    productions[i] = {
      ...production,
      ...PRODUCTION,
      id: HAI_ID,
      imageUrl: production.imageUrl || PRODUCTION.imageUrl,
      createdAt: production.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((production) => production.id === HAI_ID)) {
    productions.push(PRODUCTION);
  }

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map(
    people.map((person) => [normalizePersonName(person.name), person] as const)
  );
  for (const person of people) {
    for (const nick of person.nicknames || []) {
      const key = normalizePersonName(nick);
      if (!byName.has(key)) byName.set(key, person);
    }
  }

  const credits: Credit[] = assignBillingOrders(
    (rowsJson.credits as CreditRow[]).map((row) => ({
      personId: resolvePersonId(row.personName, people, byName, byId),
      productionId: HAI_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year || rowsJson.year,
      endYear: row.endYear,
    }))
  );

  return {
    ...data,
    people,
    productions: productions.filter(
      (production) => production.id === HAI_ID || !duplicateIds.has(production.id)
    ),
    credits: [
      ...data.credits.filter(
        (credit) =>
          credit.productionId !== HAI_ID && !duplicateIds.has(credit.productionId)
      ),
      ...credits,
    ],
  };
}
