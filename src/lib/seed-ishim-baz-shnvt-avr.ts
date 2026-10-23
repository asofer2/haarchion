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
export const BAZ_SHNVT_AVR_ID = "ht-baz-shnvt-avr";
const TITLE = "באז שנות אור ממפקדת הכוכב - ההרפתקה מתחילה";
const YEAR = 2000;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%91%D7%90%D7%96-%D7%A9%D7%A0%D7%95%D7%AA-%D7%90%D7%95%D7%A8-%D7%9E%D7%9E%D7%A4%D7%A7%D7%93%D7%AA-%D7%94%D7%9B%D7%95%D7%9B%D7%91-%D7%94%D7%94%D7%A8%D7%A4%D7%AA%D7%A7%D7%94-%D7%9E%D7%AA%D7%97%D7%99%D7%9C%D7%94-2000-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

const CREDITS: CreditRow[] = [
  { personName: "שפרירה זכאי", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "שפרירה זכאי", role: "producer", heading: "הפקת דיבוב" },
  { personName: "אלון נוימן", role: "dubber", heading: "מדבבים", character: "באז שנות אור" },
  { personName: "חן ליאוני", role: "dubber", heading: "מדבבים", character: "מירה נובה" },
  { personName: "יוסי טולדו", role: "dubber", heading: "מדבבים", character: "XR / וודי" },
  { personName: "ליאור זוהר", role: "dubber", heading: "מדבבים", character: "בוסטר / רקס" },
  {
    personName: "מיכה אוזין סליאן",
    role: "dubber",
    heading: "מדבבים",
    character: "המפקד נבולה / סמל",
  },
  { personName: "אלי גורנשטיין", role: "dubber", heading: "מדבבים", character: "זורג" },
  {
    personName: "יורם יוספסברג",
    role: "dubber",
    heading: "מדבבים",
    character: "צלם שחור משחור",
  },
  {
    personName: "אבי חדש",
    role: "dubber",
    heading: "מדבבים",
    character: "אנשים ירוקים וקטנים / וויזי",
  },
  {
    personName: "אבי אוריה",
    role: "dubber",
    heading: "מדבבים",
    character: "האם / דמויות שונות",
  },
  { personName: "מומי לוי", role: "dubber", heading: "מדבבים", character: "זבוב" },
  { personName: "עפרון אטקין", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
  { personName: "לירז ברגמן", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
];

const PRODUCTION: Production = {
  id: BAZ_SHNVT_AVR_ID,
  title: TITLE,
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary:
    "באז שנות אור יוצא להילחם בקיסר זורג ובידידו הותיק שבגד בו בעזרת שלושת חבריו החדשים שמתעקשים להצטרף אליו",
  genres: ["אנימציה", "ילדים", "מדובב - זר", "מדע בדיוני", "פנטזיה", "פעולה"],
  runtimeMinutes: 67,
  imageUrl: portrait(TITLE),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function normTitle(title: string): string {
  return title
    .replace(/['׳״"]/g, "")
    .replace(/\s*\(\s*2000\s*\)\s*$/g, "")
    .replace(/[\u05BE\u2013\u2014\-־:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sameTitle(title: string): boolean {
  return normTitle(title) === normTitle(TITLE);
}

function isThisFilm(production: Production): boolean {
  return (
    production.id === BAZ_SHNVT_AVR_ID ||
    (sameTitle(production.title) && (!production.year || production.year === YEAR))
  );
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

/** באז שנות אור: ממפקדת הכוכב — ההרפתקה מתחילה (2000) — מעמוד הופ תמיר. */
export function applyIshimBazShnvtAvr(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  let imageUrl: string | undefined;
  let createdAt: string | undefined;

  for (const production of productions) {
    if (!isThisFilm(production)) continue;
    if (production.imageUrl) imageUrl = imageUrl || production.imageUrl;
    if (production.createdAt) createdAt = createdAt || production.createdAt;
  }

  const keptProductions = productions.filter((production) => !isThisFilm(production));
  keptProductions.push({
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

  const credits: Credit[] = assignBillingOrders(
    CREDITS.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: BAZ_SHNVT_AVR_ID,
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
        if (credit.productionId === BAZ_SHNVT_AVR_ID) return false;
        const production = productions.find((item) => item.id === credit.productionId);
        return !production || !isThisFilm(production);
      }),
      ...credits,
    ],
  };
}
