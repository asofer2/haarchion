import showsJson from "@/data/ht-cast-nov19.json";
import { canonicalPersonName } from "./aliases";
import { assignBillingOrders } from "./credit-order";
import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import { portrait } from "./portrait";
import type {
  ActivityCategory,
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
  ProductionKind,
} from "./types";
import { roleToActivity } from "./types";

const NOW = "2026-11-19T00:00:00.000Z";
const HOP = "ערוץ הופ תמיר";

type Row = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
  endYear?: number;
};

type Show = {
  id: string;
  title: string;
  year: number;
  endYear?: number;
  kind: ProductionKind;
  summary?: string;
  originalTitle?: string;
  runtimeMinutes?: number;
  episodeCount?: number;
  channel?: string;
  genres?: string[];
  ishimKeys?: string[];
  ishimNotes?: Production["ishimNotes"];
  sourceUrl: string;
  credits: Row[];
};

const SHOWS = showsJson as Show[];

function normTitle(value: string): string {
  return value.replace(/['׳״"“”]/g, "").replace(/\s+/g, " ").trim();
}

function matches(production: Production, item: Show): boolean {
  if (production.id === item.id) return true;
  if (normTitle(production.title) !== normTitle(item.title)) return false;
  if (item.endYear != null) {
    return (
      production.year === item.year ||
      production.endYear === item.endYear ||
      production.year === item.endYear
    );
  }
  return production.year === item.year;
}

function productionFrom(item: Show, previous?: Production): Production {
  return {
    ...previous,
    id: item.id,
    title: item.title,
    year: item.year,
    endYear: item.endYear ?? previous?.endYear,
    kind: item.kind,
    summary: item.summary || previous?.summary || "",
    originalTitle: item.originalTitle || previous?.originalTitle,
    runtimeMinutes: item.runtimeMinutes ?? previous?.runtimeMinutes,
    episodeCount: item.episodeCount ?? previous?.episodeCount,
    channel: item.channel || previous?.channel,
    genres: item.genres?.length ? item.genres : previous?.genres || [],
    ishimKeys: item.ishimKeys?.length ? item.ishimKeys : previous?.ishimKeys,
    ishimNotes: item.ishimNotes?.length ? item.ishimNotes : previous?.ishimNotes,
    ishimClassic: true,
    imageUrl: previous?.imageUrl || portrait(item.title, item.originalTitle),
    sourceNote: HOP,
    sourceUrl: item.sourceUrl,
    createdAt: previous?.createdAt || NOW,
    updatedAt: NOW,
  };
}

function surfaceFor(kind: ProductionKind): ActivityCategory | undefined {
  if (kind === "game_israeli" || kind === "game_dubbed_foreign") return "game";
  if (kind === "cassette_kids") return "cassette";
  if (kind === "musical") return "musical";
  if (kind === "website") return undefined;
  if (
    kind === "series_dubbed_foreign" ||
    kind === "tv_series" ||
    kind === "series" ||
    kind === "tv_program"
  ) {
    return "series";
  }
  return "film";
}

function activitiesFor(role: CreditRole, kind: ProductionKind): ActivityCategory[] {
  const activity = roleToActivity(role);
  const surface = surfaceFor(kind);
  if (!surface || activity === surface) return [activity];
  return [activity, surface];
}

function stubPerson(name: string, role: CreditRole, production: Production): Person {
  const canonical = canonicalPersonName(name);
  return {
    id: `ht-${slugify(canonical) || "person"}`,
    name: canonical,
    nicknames: [],
    bio: "",
    tags: ["דיבוב", "הופ תמיר"],
    activities: activitiesFor(role, production.kind),
    sourceNote: production.sourceNote,
    sourceUrl: production.sourceUrl,
    imageUrl: portrait(canonical),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function resolvePersonId(
  name: string,
  role: CreditRole,
  production: Production,
  people: Person[],
  byName: Map<string, Person>,
  byId: Map<string, Person>
): string {
  const key = normalizePersonName(canonicalPersonName(name));
  const existing = key ? byName.get(key) : undefined;
  if (existing) return existing.id;
  let person = stubPerson(name, role, production);
  if (byId.has(person.id) && byId.get(person.id)!.name !== person.name) {
    person = { ...person, id: `${person.id}-2` };
  }
  if (!byId.has(person.id)) {
    people.push(person);
    byId.set(person.id, person);
    byName.set(normalizePersonName(person.name), person);
  }
  return person.id;
}

/** ליהוקי הופ תמיר מ-19 בנובמבר 2026. מעדכן ערך קיים או מוסיף חדש. */
export function applyIshimHopCastNov19(data: ArchiveData): ArchiveData {
  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map<string, Person>();
  for (const person of people) {
    byName.set(normalizePersonName(person.name), person);
    byName.set(normalizePersonName(canonicalPersonName(person.name)), person);
    for (const nick of person.nicknames || []) {
      const key = normalizePersonName(nick);
      if (key && !byName.has(key)) byName.set(key, person);
    }
  }

  let productions = [...data.productions];
  let credits = [...data.credits];
  const replaced = new Set<string>();
  const added: Credit[] = [];

  for (const item of SHOWS) {
    const found = productions.filter((production) => matches(production, item));
    const previous = found.find((production) => production.id === item.id) || found[0];
    const next = productionFrom(item, previous);
    if (!item.credits.length) {
      productions = productions.map((production) =>
        matches(production, item) ? { ...next, id: production.id } : production
      );
      if (!found.length) productions.push(next);
      continue;
    }
    for (const production of found) replaced.add(production.id);
    productions = productions.filter((production) => !matches(production, item));
    productions.push(next);
    added.push(
      ...assignBillingOrders(
        item.credits.map((row) => ({
          personId: resolvePersonId(row.personName, row.role, next, people, byName, byId),
          productionId: next.id,
          role: row.role,
          heading: row.heading,
          characterName: row.character,
          year: row.year ?? next.year,
          endYear: row.endYear,
        }))
      )
    );
  }

  return {
    ...data,
    people,
    productions,
    credits: [
      ...credits.filter((credit) => !replaced.has(credit.productionId)),
      ...added,
    ],
  };
}
