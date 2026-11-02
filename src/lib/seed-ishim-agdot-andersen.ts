import { assignBillingOrders } from "./credit-order";
import { normalizePersonName } from "./dedupe";
import { ISHIM_CLASSIC_SOURCE } from "./ishim-import";
import { slugify } from "./ids";
import { portrait } from "./portrait";
import { NICO_BAR_ID } from "./seed-ishim-nico-bar";
import type {
  ActivityCategory,
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
} from "./types";
import { roleToActivity } from "./types";

const NOW = "2026-11-02T00:00:00.000Z";
export const AGDOT_ANDERSEN_ID = "ishim-agdot-andrsn";
const TITLE = "אגדות אנדרסן";
const YEAR = 2005;
const SOURCE_URL =
  "https://web.archive.org/web/20210620005759/https://www.ishim.co.il/m.php?s=%D7%90%D7%92%D7%93%D7%95%D7%AA+%D7%90%D7%A0%D7%93%D7%A8%D7%A1%D7%9F";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

const PREFERRED_PERSON_ID: Record<string, string> = {
  "ניקו בר": NICO_BAR_ID,
  "אברהם מור": "abrhm-mvr",
  "אביטל אברג'ל": "abytl-abrgyl",
  "אביטל אברג'יל": "abytl-abrgyl",
  "איציק סיידוף": "aytsyk-syydvf",
  "שמוליק טנא": "shmvlyk-tna",
  "שמעון כהן": "shmavn-khn-mdbb",
  "שרון שחל": "shrvn-shchl",
};

/** צוות מדיבוב מאתר אישים (Wayback 2021-06-20). */
const CREDITS: CreditRow[] = [
  { personName: "ניקו בר", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "אורית יואלי סנה", role: "producer", heading: "הפקת דיבוב" },
  {
    personName: "ניקו בר",
    role: "dubber",
    heading: "מדבבים",
    character: "האנס כריסטיאן אנדרסן (מספר) / דמויות שונות",
  },
  {
    personName: "אביטל אברג'ל",
    role: "dubber",
    heading: "מדבבים אורחים",
    character: "דמויות שונות",
  },
  {
    personName: "אברהם מור",
    role: "dubber",
    heading: "מדבבים אורחים",
    character: "דמויות שונות",
  },
  {
    personName: "איציק סיידוף",
    role: "dubber",
    heading: "מדבבים אורחים",
    character: "דמויות שונות",
  },
  {
    personName: "שירי נדב",
    role: "dubber",
    heading: "מדבבים אורחים",
    character: "דמויות שונות",
  },
  {
    personName: "שמוליק טנא",
    role: "dubber",
    heading: "מדבבים אורחים",
    character: "דמויות שונות",
  },
  {
    personName: "שמעון כהן",
    role: "dubber",
    heading: "מדבבים אורחים",
    character: "דמויות שונות",
  },
  {
    personName: "שרון שחל",
    role: "dubber",
    heading: "מדבבים אורחים",
    character: "דמויות שונות",
  },
  {
    personName: "ששי קשת",
    role: "dubber",
    heading: "מדבבים אורחים",
    character: "דמויות שונות",
  },
];

const PRODUCTION: Production = {
  id: AGDOT_ANDERSEN_ID,
  title: TITLE,
  originalTitle: "The Fairytaler / Der var engang",
  year: YEAR,
  kind: "series_dubbed_foreign",
  summary: "עיבוד באנימציה לאגדות המפורסמות של האנס כריסטיאן אנדרסן",
  genres: ["אנימציה", "הרפתקאות", "חינוכי", "ילדים", "מדובב - זר", "פנטזיה"],
  channel: "חינוכית",
  runtimeMinutes: 25,
  episodeCount: 26,
  ishimClassic: true,
  imageUrl: portrait(TITLE, "The Fairytaler"),
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: SOURCE_URL,
  entryAuthors: ["ברק חננאל", "תמיר סופר"],
  createdAt: NOW,
  updatedAt: NOW,
};

function isThisShow(production: Production): boolean {
  if (production.id === AGDOT_ANDERSEN_ID) return true;
  return production.title === TITLE && production.year === YEAR;
}

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "series" ? ["series"] : [activity, "series"];
}

function stubPerson(name: string, role: CreditRole): Person {
  const preferred = PREFERRED_PERSON_ID[name];
  return {
    id: preferred || `ishim-${slugify(name) || "person"}`,
    name,
    nicknames: [],
    bio: `מדבב/ת ועורך/ת מדיה — ערך מתוך ארכיון אישים («${TITLE}», ${YEAR}).`,
    tags: ["דיבוב"],
    activities: activitiesFor(role),
    ishimClassic: true,
    sourceNote: ISHIM_CLASSIC_SOURCE,
    sourceUrl: SOURCE_URL,
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
  const preferred = PREFERRED_PERSON_ID[name];
  if (preferred && byId.has(preferred)) return preferred;

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

/** אגדות אנדרסן (2005) — מעמוד אישים ב־Wayback. */
export function applyIshimAgdotAndersen(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  let imageUrl: string | undefined;
  let createdAt: string | undefined;

  for (const production of productions) {
    if (!isThisShow(production)) continue;
    if (production.imageUrl) imageUrl = imageUrl || production.imageUrl;
    if (production.createdAt) createdAt = createdAt || production.createdAt;
  }

  const replacedIds = new Set(
    productions.filter(isThisShow).map((production) => production.id)
  );
  const kept = productions.filter((production) => !isThisShow(production));
  kept.push({
    ...PRODUCTION,
    imageUrl: imageUrl || PRODUCTION.imageUrl,
    createdAt: createdAt || NOW,
    updatedAt: NOW,
  });

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
    CREDITS.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: AGDOT_ANDERSEN_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: YEAR,
    }))
  );

  return {
    ...data,
    people,
    productions: kept,
    credits: [
      ...data.credits.filter((credit) => !replacedIds.has(credit.productionId)),
      ...credits,
    ],
  };
}
