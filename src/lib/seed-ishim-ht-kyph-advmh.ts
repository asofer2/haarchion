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
} from "./types";
import { roleToActivity } from "./types";

const NOW = "2026-11-03T00:00:00.000Z";
/** כיפה אדומה - הסיפור האמיתי (2006) — Hoodwinked! — מעמוד הופ תמיר. */
export const HOODWINKED_2006_ID = "ht-kyph-advmh";
const TITLE = "כיפה אדומה - הסיפור האמיתי";
const YEAR = 2006;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%9B%D7%99%D7%A4%D7%94-%D7%90%D7%93%D7%95%D7%9E%D7%94-%D7%94%D7%A1%D7%99%D7%A4%D7%95%D7%A8-%D7%94%D7%90%D7%9E%D7%99%D7%AA%D7%99-2006-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

/** שמות תצוגה ששונים מהשם בעמוד, או שיש להם כפילות בארכיון. */
const PREFERRED_PERSON_ID: Record<string, string> = {
  "שפרירה זכאי": "shafrira-zachai",
  "אגם רודברג": "agam-rodberg",
  "אלי גורנשטיין": "eli-gorenstein",
  "עידו מוסרי": "ido-mosseri",
  "מיקי קם": "miki-kam",
  "יובל זמיר": "yvbl-zmyr",
  "טל פרידמן": "tl-prydmn",
  "יורם יוספסברג": "yoram-yosefsberg",
  "שמעון כהן": "shmavn-khn-mdbb",
  "מומי לוי": "mvmy-lvy",
  "אלון אופיר": "alon-ofir",
  "דורון רביץ": "dvrvn-rbyts",
  "דב רייזר": "dov-reiber",
  "מיכה אוזין סליאן": "mykh-avzyn-slyan",
  "איציק סיידוף": "aytsyk-syydvf",
  "רוני וייס": "ht-rvny-vyys",
};

/**
 * עמוד הופ תמיר: בימוי והפקת דיבוב, ואז מדבב מול דמות.
 * תחת «מוזיקה»: «שירה» = מומי לוי, «ניהול מוזיקלי» = רוני וייס.
 */
const CREDITS: CreditRow[] = [
  { personName: "שפרירה זכאי", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "שפרירה זכאי", role: "producer", heading: "הפקת דיבוב" },
  {
    personName: "אגם רודברג",
    role: "dubber",
    heading: "מדבבים",
    character: 'כיפה "כיפ" אדומה',
  },
  { personName: "אלי גורנשטיין", role: "dubber", heading: "מדבבים", character: "הזאב" },
  { personName: "עידו מוסרי", role: "dubber", heading: "מדבבים", character: "טוויצ'י" },
  { personName: "מיקי קם", role: "dubber", heading: "מדבבים", character: "סבתא" },
  { personName: "יובל זמיר", role: "dubber", heading: "מדבבים", character: "הצייד" },
  {
    personName: "טל פרידמן",
    role: "dubber",
    heading: "מדבבים",
    character: "ניקי הצפרדע",
  },
  {
    personName: "יורם יוספסברג",
    role: "dubber",
    heading: "מדבבים",
    character: "המפקח גריזלי",
  },
  {
    personName: "שמעון כהן",
    role: "dubber",
    heading: "מדבבים",
    character: "הבלש ביל החסידה / דמויות שונות",
  },
  { personName: "מומי לוי", role: "dubber", heading: "מדבבים", character: "התייש המזמר" },
  { personName: "אלון אופיר", role: "dubber", heading: "מדבבים", character: "בוינגו" },
  { personName: "דורון רביץ", role: "dubber", heading: "מדבבים", character: "ריטה התנית" },
  {
    personName: "דב רייזר",
    role: "dubber",
    heading: "מדבבים",
    character: "דולף / דמויות שונות",
  },
  {
    personName: "מיכה אוזין סליאן",
    role: "dubber",
    heading: "מדבבים",
    character: "דמויות שונות",
  },
  {
    personName: "איציק סיידוף",
    role: "dubber",
    heading: "מדבבים",
    character: "דמויות שונות",
  },
  { personName: "אדם זמק", role: "dubber", heading: "מדבבים", character: "נקר / ילדים" },
  { personName: "שירה זמק", role: "dubber", heading: "מדבבים", character: "ילדות" },
  { personName: "מומי לוי", role: "singer", heading: "מוזיקה", character: "שירה" },
  {
    personName: "רוני וייס",
    role: "singer",
    heading: "מוזיקה",
    character: "ניהול מוזיקלי",
  },
];

const PRODUCTION: Production = {
  id: HOODWINKED_2006_ID,
  title: TITLE,
  originalTitle: "Hoodwinked!",
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary:
    "חוקר מגיע לביתה של סבתא וחוקר את כל הדמויות בסיפור בנוגע למה שקרה. כך מתקבל אותו סיפור מנקודות מבט שונות",
  genres: ["אנימציה", "ילדים", "מדובב - זר", "מוזיקלי", "פשע", "קומדיה"],
  runtimeMinutes: 80,
  ishimKeys: ["סדרת סרטים"],
  ishimClassic: true,
  imageUrl: portrait(TITLE, "Hoodwinked!"),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function normTitle(title: string): string {
  return title
    .replace(/['׳:]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function isThisShow(production: Production): boolean {
  if (production.id === HOODWINKED_2006_ID) return true;
  if (production.id.startsWith("ishim-kyph-advmh-hsypvr")) return true;
  return production.year === YEAR && normTitle(production.title) === normTitle(TITLE);
}

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "film" ? ["film"] : [activity, "film"];
}

function stubPerson(name: string, role: CreditRole): Person {
  return {
    id: `ht-${slugify(name) || "person"}`,
    name,
    nicknames: [],
    bio: `מדבב/ת ועורך/ת מדיה — ערך מתוך ארכיון ערוץ הופ תמיר («${TITLE}», ${YEAR}).`,
    tags: ["דיבוב", "הופ תמיר"],
    activities: activitiesFor(role),
    sourceNote: SOURCE_NOTE,
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

/** כיפה אדומה - הסיפור האמיתי (2006) — מעמוד הופ תמיר. מחליף ערך חלקי מפילמוגרפיה. */
export function applyIshimHoodwinked2006(data: ArchiveData): ArchiveData {
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
      productionId: HOODWINKED_2006_ID,
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
