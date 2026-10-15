import rowsJson from "@/data/ha-pigamot.json";
import { assignBillingOrders } from "./credit-order";
import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import { ISHIM_CLASSIC_SOURCE, ishimWaybackPersonUrl } from "./ishim-import";
import { portrait } from "./portrait";
import type {
  ActivityCategory,
  AirStatus,
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
} from "./types";
import { roleToActivity } from "./types";

const NOW = "2026-10-15T00:00:00.000Z";
export const HA_PIGAMOT_ID = "ishim-hpygmvt";
const SOURCE_URL =
  "https://web.archive.org/web/20200727164440/https://www.ishim.co.il/m.php?s=%D7%94%D7%A4%D7%99%D7%92%27%D7%9E%D7%95%D7%AA";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
  endYear?: number;
};

function sameTitle(title: string): boolean {
  return title.replace(/['׳]/g, "'") === rowsJson.title;
}

const PRODUCTION: Production = {
  id: HA_PIGAMOT_ID,
  title: rowsJson.title,
  year: rowsJson.year,
  endYear: rowsJson.endYear,
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
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "series" ? ["series"] : [activity, "series"];
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
  if (name === "טוביה צפיר" && byId.has("tuvia-tsafir")) return "tuvia-tsafir";

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

/** הפיג'מות (2003–2015) מעמוד אישים בארכיון 27 ביולי 2020. */
export function applyIshimHaPigamot(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const production = productions[i];
    if (!sameTitle(production.title) && production.id !== HA_PIGAMOT_ID) continue;
    if (production.id !== HA_PIGAMOT_ID) duplicateIds.add(production.id);
    productions[i] = {
      ...production,
      ...PRODUCTION,
      id: HA_PIGAMOT_ID,
      imageUrl: production.imageUrl || PRODUCTION.imageUrl,
      createdAt: production.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((production) => production.id === HA_PIGAMOT_ID)) {
    productions.push(PRODUCTION);
  }

  const keptProductions = productions.filter(
    (production) => production.id === HA_PIGAMOT_ID || !sameTitle(production.title)
  );

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
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: HA_PIGAMOT_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year,
      endYear: row.endYear,
    }))
  );

  return {
    ...data,
    people,
    productions: keptProductions,
    credits: [
      ...data.credits.filter((credit) => {
        if (credit.productionId === HA_PIGAMOT_ID) return false;
        if (duplicateIds.has(credit.productionId)) return false;
        const production = data.productions.find((item) => item.id === credit.productionId);
        return !production || !sameTitle(production.title);
      }),
      ...credits,
    ],
  };
}
