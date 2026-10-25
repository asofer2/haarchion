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

const NOW = "2026-10-25T00:00:00.000Z";
/** הבובודים (2002) — עמוד הופ תמיר. אין ערך קודם בארכיון. */
export const HBOBODIM_2002_ID = "ht-hbvbvdym";
const TITLE = "הבובודים";
const YEAR = 2002;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%91%D7%95%D7%91%D7%95%D7%93%D7%99%D7%9D-2002-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

/**
 * Right column = person, left column = role.
 * בימוי דיבוב / הפקת דיבוב are crew headings, not character names.
 * «ילד» and «גוגונאס» sit beside the person link in the same cell.
 */
const CREDITS: CreditRow[] = [
  { personName: "שפרירה זכאי", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "שפרירה זכאי", role: "producer", heading: "הפקת דיבוב" },
  { personName: "רמה מסינגר", role: "dubber", heading: "מדבבים", character: "פוקהונטס" },
  { personName: "אלון אופיר", role: "dubber", heading: "מדבבים", character: "ג'ון רולף" },
  { personName: "יגאל שדה", role: "dubber", heading: "מדבבים", character: "ג'ון סמית" },
  { personName: "דני ליטני", role: "dubber", heading: "מדבבים", character: "המושל רטקליף" },
  { personName: "דב רייזר", role: "dubber", heading: "מדבבים", character: "צ'יף פוהאטאן" },
  { personName: "שרית וינו אלעד", role: "dubber", heading: "מדבבים", character: "נאקומה" },
  { personName: "נחמה הנדל", role: "dubber", heading: "מדבבים", character: "סבתא-רבא" },
  { personName: "איציק סיידוף", role: "dubber", heading: "מדבבים", character: "המלך ג'יימס" },
  { personName: "יעל פרל בקר", role: "dubber", heading: "מדבבים", character: "המלכה אן" },
  { personName: "אפי בן ישראל", role: "dubber", heading: "מדבבים", character: "גברת ג'נקינס" },
  { personName: "גיל סגל", role: "dubber", heading: "מדבבים", character: "ילד" },
  { personName: "עפרון אטקין", role: "dubber", heading: "מדבבים", character: "גוגונאס" },
  { personName: "גיל זמק", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
  { personName: "יובל זמיר", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
  { personName: "מומי לוי", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
  { personName: "שמוליק טנא", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
  { personName: "שמעון כהן", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
  { personName: "שפרירה זכאי", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
  {
    personName: "רוני וייס",
    role: "singer",
    heading: "מוזיקה",
    character: "ניהול מוזיקלי",
  },
];

const PRODUCTION: Production = {
  id: HBOBODIM_2002_ID,
  title: TITLE,
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary: "",
  genres: ["אנימציה", "ילדים", "מדובב - זר", "מוזיקלי", "מלחמה", "מתח"],
  imageUrl: portrait(TITLE),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function isThisProduction(production: Production): boolean {
  if (production.id === HBOBODIM_2002_ID) return true;
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

/** הבובודים (2002) — מעמוד הופ תמיר. מוסיף הפקה חדשה ולא נוגע בערכים משנה אחרת. */
export function applyIshimHbobodim2002(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const production = productions[i];
    if (!isThisProduction(production)) continue;
    if (production.id !== HBOBODIM_2002_ID) duplicateIds.add(production.id);
    productions[i] = {
      ...production,
      ...PRODUCTION,
      id: HBOBODIM_2002_ID,
      imageUrl: production.imageUrl || PRODUCTION.imageUrl,
      createdAt: production.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((production) => production.id === HBOBODIM_2002_ID)) {
    productions.push(PRODUCTION);
  }

  const keptProductions = productions.filter(
    (production) =>
      production.id === HBOBODIM_2002_ID || !duplicateIds.has(production.id)
  );

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map(
    people.map((person) => [normalizePersonName(person.name), person] as const)
  );

  const credits: Credit[] = assignBillingOrders(
    CREDITS.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: HBOBODIM_2002_ID,
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
        if (credit.productionId === HBOBODIM_2002_ID) return false;
        return !duplicateIds.has(credit.productionId);
      }),
      ...credits,
    ],
  };
}
