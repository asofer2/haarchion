import rowsJson from "@/data/pvkhvnts-2.json";
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
/** Archive id for «פוקהונטס 2 - מסע לעולם חדש» — not the 1995 פוקהונטס. */
export const PVKHVNTS_2_ID = "ishim-pvkhvnts-2-msa-lavlm-chdsh";

const WAYBACK_URL =
  "https://web.archive.org/web/20211104055156/https://www.ishim.co.il/m.php?s=%D7%A4%D7%95%D7%A7%D7%94%D7%95%D7%A0%D7%98%D7%A1+2+-+%D7%9E%D7%A1%D7%A2+%D7%9C%D7%A2%D7%95%D7%9C%D7%9D+%D7%97%D7%93%D7%A9";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

const PRODUCTION: Production = {
  id: PVKHVNTS_2_ID,
  title: rowsJson.title,
  year: rowsJson.year,
  kind: "film_dubbed_foreign",
  summary: rowsJson.summary,
  genres: rowsJson.genres,
  runtimeMinutes: rowsJson.runtimeMinutes,
  ishimClassic: true,
  imageUrl: portrait(rowsJson.title, "Pocahontas II: Journey to a New World", {
    kind: "film",
  }),
  entryAuthors: rowsJson.entryAuthors,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: WAYBACK_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

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
  const key = normalizePersonName(name);
  const existing = byName.get(key);
  if (existing) return existing.id;

  let person = stubPerson(name, role);
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

function isSequel(production: Production): boolean {
  return production.id === PVKHVNTS_2_ID || production.title === rowsJson.title;
}

/** «פוקהונטס 2 - מסע לעולם חדש» לפי אישים (Wayback 2021-11-04). */
export function applyIshimPvkhvnts2(data: ArchiveData): ArchiveData {
  const matches = data.productions.filter(isSequel);
  const stored = matches.find(
    (production) =>
      production.imageUrl &&
      /^https?:\/\//i.test(production.imageUrl) &&
      !production.imageUrl.includes("/api/portrait") &&
      !production.imageUrl.includes("/api/wiki-image")
  );
  const existing = stored || matches.find((production) => production.imageUrl) || matches[0];
  const duplicateIds = new Set(
    matches.map((production) => production.id).filter((id) => id !== PVKHVNTS_2_ID)
  );

  const record: Production = existing
    ? {
        ...existing,
        ...PRODUCTION,
        id: PVKHVNTS_2_ID,
        imageUrl: existing.imageUrl || PRODUCTION.imageUrl,
        createdAt: existing.createdAt || NOW,
        updatedAt: NOW,
      }
    : PRODUCTION;

  const productions = [
    ...data.productions.filter((production) => !isSequel(production)),
    record,
  ];

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
      productionId: PVKHVNTS_2_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: rowsJson.year,
    }))
  );

  return {
    ...data,
    people,
    productions,
    credits: [
      ...data.credits.filter(
        (credit) =>
          credit.productionId !== PVKHVNTS_2_ID &&
          !duplicateIds.has(credit.productionId)
      ),
      ...credits,
    ],
  };
}
