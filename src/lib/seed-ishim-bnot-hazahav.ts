import rowsJson from "@/data/bnot-hazahav.json";
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

const NOW = "2026-11-06T00:00:00.000Z";
export const BNOT_HAZAHAV_ID = "ishim-bnvt-hzhb";
const SOURCE_URL =
  "https://web.archive.org/web/20211209093825/https://www.ishim.co.il/m.php?s=%D7%91%D7%A0%D7%95%D7%AA+%D7%94%D7%96%D7%94%D7%91";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
  endYear?: number;
};

const PRODUCTION: Production = {
  id: BNOT_HAZAHAV_ID,
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

function activitiesFor(role: CreditRole): ActivityCategory[] {
  if (role === "actor") return ["acting", "series"];
  if (role === "composer" || role === "singer") return ["musical", "series"];
  return ["series"];
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

function isThisSeries(production: Production): boolean {
  if (production.id === BNOT_HAZAHAV_ID) return true;
  if (production.title !== rowsJson.title) return false;
  const year = production.year || 0;
  return year === 0 || (year >= 2011 && year <= 2016);
}

/** סדרת הטלוויזיה «בנות הזהב» (2011–2016) לפי עמוד אישים בארכיון 9 בדצמבר 2021. */
export function applyIshimBnotHazahav(data: ArchiveData): ArchiveData {
  const duplicateIds = new Set<string>();
  let canonical: Production | null = null;
  const productions: Production[] = [];

  for (const production of data.productions) {
    if (!isThisSeries(production)) {
      productions.push(production);
      continue;
    }
    duplicateIds.add(production.id);
    if (!canonical) {
      canonical = {
        ...PRODUCTION,
        imageUrl: production.imageUrl || PRODUCTION.imageUrl,
        ...(production.imageSource
          ? {
              imageSource: production.imageSource,
              imageCachedAt: production.imageCachedAt,
            }
          : {}),
        createdAt: production.createdAt || NOW,
        updatedAt: NOW,
      };
      continue;
    }
    if (!canonical.imageUrl && production.imageUrl) {
      canonical = {
        ...canonical,
        imageUrl: production.imageUrl,
        ...(production.imageSource
          ? {
              imageSource: production.imageSource,
              imageCachedAt: production.imageCachedAt,
            }
          : {}),
      };
    }
  }

  productions.push(canonical ?? PRODUCTION);

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

  const createdHere = new Set<string>();

  function resolvePersonId(name: string, role: CreditRole): string {
    const key = normalizePersonName(name);
    const existing = byName.get(key);
    if (existing) {
      if (createdHere.has(existing.id)) {
        for (const activity of activitiesFor(role)) {
          if (!existing.activities.includes(activity)) existing.activities.push(activity);
        }
      }
      return existing.id;
    }

    let person = stubPerson(name, role);
    if (byId.has(person.id) && byId.get(person.id)!.name !== name) {
      person = { ...person, id: `${person.id}-${slugify(name).slice(0, 8)}` };
    }
    if (!byId.has(person.id)) {
      people.push(person);
      byId.set(person.id, person);
      byName.set(key, person);
      createdHere.add(person.id);
    }
    return person.id;
  }

  const credits: Credit[] = assignBillingOrders(
    (rowsJson.credits as CreditRow[]).map((row) => ({
      personId: resolvePersonId(row.personName, row.role),
      productionId: BNOT_HAZAHAV_ID,
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
    productions,
    credits: [
      ...data.credits.filter(
        (credit) =>
          credit.productionId !== BNOT_HAZAHAV_ID &&
          !duplicateIds.has(credit.productionId)
      ),
      ...credits,
    ],
  };
}
