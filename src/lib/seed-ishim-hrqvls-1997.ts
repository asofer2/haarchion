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
} from "./types";
import { roleToActivity } from "./types";

const NOW = "2026-10-23T00:00:00.000Z";
/** Existing 1997 Disney Hercules entry — updated in place, not a second film. */
export const HERCULES_1997_ID = "hercules-he";
const TITLE = "הרקולס";
const YEAR = 1997;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%A8%D7%A7%D7%95%D7%9C%D7%A1-1997-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

/** Right column = person, left column = role. From the Hop Tamir page. */
const CREDITS: CreditRow[] = [
  { personName: "שפרירה זכאי", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "שפרירה זכאי", role: "producer", heading: "הפקת דיבוב" },
  { personName: "אורי הוכמן", role: "dubber", heading: "מדבבים", character: "הרקולס" },
  { personName: "עופר גילברון", role: "dubber", heading: "מדבבים", character: "הרקולס הצעיר" },
  { personName: "נועה תשבי", role: "dubber", heading: "מדבבים", character: "מגארה" },
  { personName: "אוהד שחר", role: "dubber", heading: "מדבבים", character: "פיל" },
  { personName: "נתן דטנר", role: "dubber", heading: "מדבבים", character: "האדס" },
  { personName: "אריאל פורמן", role: "dubber", heading: "מדבבים", character: "זאוס" },
  { personName: "יעל פרל בקר", role: "dubber", heading: "מדבבים", character: "הרה" },
  {
    personName: "אבי חדש",
    role: "dubber",
    heading: "מדבבים",
    character: "הרמס / תושב מלוכלך",
  },
  { personName: "תומר שרון", role: "dubber", heading: "מדבבים", character: "כאב" },
  { personName: "תומר יוסף", role: "dubber", heading: "מדבבים", character: "פחד" },
  {
    personName: "שמעון כהן",
    role: "dubber",
    heading: "מדבבים",
    character: "נסוס / הציקלופ / דמויות שונות",
  },
  {
    personName: "איציק סיידוף",
    role: "dubber",
    heading: "מדבבים",
    character: "אמפיטריון / כרוז",
  },
  {
    personName: "רותי הולצמן",
    role: "dubber",
    heading: "מדבבים",
    character: "אלקמנה / אטרופוס",
  },
  {
    personName: "שרית סרי",
    role: "dubber",
    heading: "מדבבים",
    character: "קלוטו / תושבת רזה",
  },
  {
    personName: "שרית וינו אלעד",
    role: "dubber",
    heading: "מדבבים",
    character: "לקטיס / דמויות שונות",
  },
  { personName: "דינה גולן", role: "dubber", heading: "מדבבים", character: "מוזה תאליה" },
  {
    personName: "שרונה נסטוביץ'",
    role: "dubber",
    heading: "מדבבים",
    character: "מוזה טרפיסקורה",
  },
  { personName: "סיניה בועז", role: "dubber", heading: "מדבבים", character: "מוזה קאליופה" },
  { personName: "אתי קארי", role: "dubber", heading: "מדבבים", character: "מוזה קליאוצ" },
  { personName: "אורלי טרי", role: "dubber", heading: "מדבבים", character: "מוזה מלפומנה" },
  {
    personName: "דב רייזר",
    role: "dubber",
    heading: "מדבבים",
    character: "קריינות / דמויות שונות",
  },
  {
    personName: "יעקב בוך",
    role: "dubber",
    heading: "מדבבים",
    character: "תושב ביריון / מוכר כדים",
  },
  { personName: "דורון פלסקוב", role: "dubber", heading: "מדבבים", character: "נער" },
  { personName: "אדם נוישטיין", role: "dubber", heading: "מדבבים", character: "נער" },
  { personName: "גיל סגל", role: "dubber", heading: "מדבבים", character: "ילד" },
  { personName: "מיכאל הנגבי", role: "dubber", heading: "מדבבים", character: "ילד" },
  {
    personName: "עפרון אטקין",
    role: "dubber",
    heading: "מדבבים",
    character: "דמויות שונות",
  },
  {
    personName: "רוני וייס",
    role: "singer",
    heading: "מוזיקה",
    character: "ניהול מוזיקלי",
  },
];

const PRODUCTION: Production = {
  id: HERCULES_1997_ID,
  title: TITLE,
  originalTitle: "Hercules",
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary:
    "בנם של האל היווני הגדול זאוס והרה הפך לבן תמותה ונחטף מהאולימפוס, וכעת עליו להוכיח שהוא גיבור אמיתי בכדי לחזור",
  genres: [
    "אנימציה",
    "דרמה",
    "מדובב - זר",
    "מוזיקלי",
    "נוער",
    "פנטזיה",
    "פעולה",
    "קומדיה",
  ],
  runtimeMinutes: 93,
  ishimNotes: [{ heading: "כללי", items: ["קיים עוד הרקולס"] }],
  imageUrl: portrait(TITLE, "Hercules"),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function isThisFilm(production: Production): boolean {
  if (production.id === HERCULES_1997_ID) return true;
  if (production.title !== TITLE || production.year !== YEAR) return false;
  return production.endYear == null || production.endYear === YEAR;
}

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "film" ? ["film"] : [activity, "film"];
}

function stubPerson(name: string, role: CreditRole): Person {
  const canonical = canonicalPersonName(name);
  return {
    id: `ht-${slugify(canonical) || "person"}`,
    name: canonical,
    nicknames: [],
    bio: `מדבב/ת ועורך/ת מדיה — ערך מתוך ארכיון ערוץ הופ תמיר («${TITLE}», ${YEAR}).`,
    tags: ["דיבוב", "הופ תמיר"],
    activities: activitiesFor(role),
    sourceNote: SOURCE_NOTE,
    sourceUrl: SOURCE_URL,
    imageUrl: portrait(canonical),
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
  if (byId.has(person.id) && byId.get(person.id)!.name !== person.name) {
    person = { ...person, id: `${person.id}-${slugify(person.name).slice(0, 8)}` };
  }
  if (!byId.has(person.id)) {
    people.push(person);
    byId.set(person.id, person);
    byName.set(normalizePersonName(person.name), person);
  }
  return person.id;
}

/** הרקולס (1997) — Hercules — מעמוד הופ תמיר. מעדכן את hercules-he ולא נוגע בהרקולס משנה אחרת. */
export function applyIshimHercules1997(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const production = productions[i];
    if (!isThisFilm(production)) continue;
    if (production.id !== HERCULES_1997_ID) duplicateIds.add(production.id);
    productions[i] = {
      ...production,
      ...PRODUCTION,
      id: HERCULES_1997_ID,
      imageUrl: production.imageUrl || PRODUCTION.imageUrl,
      createdAt: production.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((production) => production.id === HERCULES_1997_ID)) {
    productions.push(PRODUCTION);
  }

  const keptProductions = productions.filter(
    (production) =>
      production.id === HERCULES_1997_ID || !duplicateIds.has(production.id)
  );

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map(
    people.map((person) => [normalizePersonName(person.name), person] as const)
  );

  const credits: Credit[] = assignBillingOrders(
    CREDITS.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: HERCULES_1997_ID,
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
        if (credit.productionId === HERCULES_1997_ID) return false;
        return !duplicateIds.has(credit.productionId);
      }),
      ...credits,
    ],
  };
}
