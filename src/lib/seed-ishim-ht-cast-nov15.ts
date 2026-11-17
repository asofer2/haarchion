import showsJson from "@/data/ht-cast-nov15.json";
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

const NOW = "2026-11-15T00:00:00.000Z";
const HOP = "ערוץ הופ תמיר";
const OZ_TITLE = "בחזרה לארץ עוץ";
const OZ_2014_ID = "ht-bchzrh-larts-avts-2014";
const OZ_1995_SUMMARY =
  "דורותי חוזרת לארץ עוץ כדי לסכל את מזימתה של מומבי בעזרת ידידיה הותיקים וחברים חדשים";
const OZ_1995_GENRES = [
  "אנימציה",
  "דרמה",
  "ילדים",
  "מדובב - זר",
  "מדע בדיוני",
  "מוזיקלי",
  "פנטזיה",
  "פעולה",
  "קומדיה",
];

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
  if (item.id === "ht-pynvkyv") return production.year === 2006;
  if (item.id === "ht-game-artvr") {
    return production.year === 2010 && production.kind.includes("game");
  }
  if (item.id === "ht-peter-pan-adventures") {
    return production.year === 1990 || production.year === 1991;
  }
  if (item.id === "ht-hpygmvt-hmhzmr") return production.year === 2003;
  if (item.id === "ht-hsykh-hksvf") return true;
  if (item.id === "ht-antvny-hnmlh") {
    const title = normTitle(production.title);
    return (
      (title === "אנתוני הנמלה" || title === "אנטוני הנמלה") &&
      production.year === 2017
    );
  }
  if (item.id === OZ_2014_ID) return production.year === 2014;
  return production.year === item.year;
}

/** הארכיון מדביק את 1995 ואת 2014 לאותה רשומה. 1995 נשארת, ו-2014 נבנית מחדש. */
function separateOz1995(
  productions: Production[],
  credits: Credit[]
): { productions: Production[]; credits: Credit[] } {
  const oz = productions.filter((production) => normTitle(production.title) === OZ_TITLE);
  if (!oz.length) return { productions, credits };
  const ids = new Set(oz.map((production) => production.id));
  const from1995 = credits.filter(
    (credit) => ids.has(credit.productionId) && credit.year === 1995
  );
  if (!from1995.length) return { productions, credits };

  const existing1995 = oz.find(
    (production) => production.year === 1995 && production.id !== OZ_2014_ID
  );
  const host =
    existing1995 || oz.find((production) => production.id !== OZ_2014_ID);
  if (!host) return { productions, credits };
  const id1995 = existing1995?.id || host.id;
  const restored: Production = existing1995
    ? existing1995
    : {
        ...host,
        id: id1995,
        title: OZ_TITLE,
        year: 1995,
        kind: "film_dubbed_foreign",
        summary: OZ_1995_SUMMARY,
        genres: OZ_1995_GENRES,
        runtimeMinutes: undefined,
        sourceUrl: host.sourceUrl?.includes("2014") ? undefined : host.sourceUrl,
        updatedAt: NOW,
      };

  return {
    productions: [
      ...productions.filter(
        (production) =>
          normTitle(production.title) !== OZ_TITLE || production.id === OZ_2014_ID
      ),
      restored,
    ],
    credits: [
      ...credits.filter((credit) => !ids.has(credit.productionId)),
      ...from1995.map((credit) => ({ ...credit, productionId: id1995 })),
    ],
  };
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

/** ליהוקי הופ תמיר מ-15 בנובמבר 2026. מעדכן ערך קיים או מוסיף חדש. */
export function applyIshimHopCastNov15(data: ArchiveData): ArchiveData {
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

  const separated = separateOz1995([...data.productions], [...data.credits]);
  let productions = separated.productions;
  let credits = separated.credits;
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
