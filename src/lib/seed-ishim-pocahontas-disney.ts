import rowsJson from "@/data/pocahontas-disney.json";
import { assignBillingOrders } from "./credit-order";
import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import { ISHIM_CLASSIC_SOURCE, ishimWaybackPersonUrl } from "./ishim-import";
import { portrait } from "./portrait";
import type {
  ActivityCategory,
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
} from "./types";
import { roleToActivity } from "./types";

const NOW = "2026-10-23T00:00:00.000Z";
/** Existing Disney Hebrew-dub entry. Do not attach the ערוץ הילדים series. */
export const POCAHONTAS_DISNEY_ID = "pocahontas-he";
const TITLE = "פוקהונטס";
const YEAR = 1995;
const SOURCE_URL =
  "https://web.archive.org/web/20211022133843/https://www.ishim.co.il/m.php?s=%D7%A4%D7%95%D7%A7%D7%94%D7%95%D7%A0%D7%98%D7%A1%23%D7%93%D7%99%D7%A1%D7%A0%D7%99";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

const PRODUCTION: Production = {
  id: POCAHONTAS_DISNEY_ID,
  title: rowsJson.title,
  originalTitle: rowsJson.originalTitle,
  year: rowsJson.year,
  kind: "film_dubbed_foreign",
  summary: rowsJson.summary,
  genres: rowsJson.genres,
  runtimeMinutes: rowsJson.runtimeMinutes,
  ishimNotes: rowsJson.ishimNotes,
  ishimClassic: true,
  imageUrl: portrait(rowsJson.title, rowsJson.originalTitle),
  entryAuthors: rowsJson.entryAuthors,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function isDisneyFilm(production: Production): boolean {
  if (production.id === POCAHONTAS_DISNEY_ID) return true;
  if (production.title !== TITLE || production.year !== YEAR) return false;
  if (production.channel === "ערוץ הילדים") return false;
  if (
    production.kind !== "film" &&
    production.kind !== "film_dubbed_foreign" &&
    production.kind !== "film_cinema"
  ) {
    return false;
  }
  return production.originalTitle === "Pocahontas";
}

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "film" ? ["film"] : [activity, "film"];
}

function stubPerson(name: string, role: CreditRole): Person {
  return {
    id: `ishim-${slugify(name) || "person"}`,
    name,
    nicknames: [],
    bio: "",
    tags: [],
    activities: activitiesFor(role),
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
  role: CreditRole,
  people: Person[],
  byName: Map<string, Person>,
  byId: Map<string, Person>
): string {
  const existing = byName.get(normalizePersonName(name));
  if (existing) return existing.id;

  let person = stubPerson(name, role);
  if (byId.has(person.id) && byId.get(person.id)!.name !== name) {
    person = { ...person, id: `${person.id}-${slugify(name).slice(0, 8)}` };
  }
  if (!byId.has(person.id)) {
    people.push(person);
    byId.set(person.id, person);
    byName.set(normalizePersonName(name), person);
  }
  return person.id;
}

/** פוקהונטס של דיסני (1995) לפי אישים. לא נוגע בגרסת ערוץ הילדים. */
export function applyIshimPocahontasDisney(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const production = productions[i];
    if (!isDisneyFilm(production)) continue;
    if (production.id !== POCAHONTAS_DISNEY_ID) duplicateIds.add(production.id);
    productions[i] = {
      ...production,
      ...PRODUCTION,
      id: POCAHONTAS_DISNEY_ID,
      imageUrl: production.imageUrl || PRODUCTION.imageUrl,
      createdAt: production.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((production) => production.id === POCAHONTAS_DISNEY_ID)) {
    productions.push(PRODUCTION);
  }

  const keptProductions = productions.filter(
    (production) =>
      production.id === POCAHONTAS_DISNEY_ID || !duplicateIds.has(production.id)
  );

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map(
    people.map((person) => [normalizePersonName(person.name), person] as const)
  );
  for (const person of people) {
    for (const nick of person.nicknames || []) {
      const key = normalizePersonName(nick);
      if (!key || byName.has(key)) continue;
      byName.set(key, person);
    }
  }

  const credits: Credit[] = assignBillingOrders(
    (rowsJson.credits as CreditRow[]).map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: POCAHONTAS_DISNEY_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: YEAR,
    }))
  );

  return {
    ...data,
    people,
    productions: keptProductions,
    credits: [
      ...data.credits.filter((credit) => {
        if (credit.productionId === POCAHONTAS_DISNEY_ID) return false;
        return !duplicateIds.has(credit.productionId);
      }),
      ...credits,
    ],
  };
}
