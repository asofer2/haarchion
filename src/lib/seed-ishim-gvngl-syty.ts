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

const NOW = "2026-10-21T00:00:00.000Z";
export const JUNGLE_CITY_2006_ID = "ht-gvngl-syty";
const TITLE = "ג'ונגל סיטי";
const YEAR = 2006;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%92%D7%95%D7%A0%D7%92%D7%9C-%D7%A1%D7%99%D7%98%D7%99-2006-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

const CREDITS: CreditRow[] = [
  { personName: "שרון כהן", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "יורם יוספסברג", role: "dubber", heading: "מדבבים", character: "סמסון" },
  { personName: "עמית טולדנו", role: "dubber", heading: "מדבבים", character: "ראיין" },
  { personName: "אריה מוסקונה", role: "dubber", heading: "מדבבים", character: "בני" },
  { personName: "דביר בנדק", role: "dubber", heading: "מדבבים", character: "נייג'ל" },
  { personName: "עדי קוזלובסקי", role: "dubber", heading: "מדבבים", character: "ברידג'ט" },
  { personName: "מתי אטלס", role: "dubber", heading: "מדבבים", character: "לארי" },
  { personName: "אריה צ'רנר", role: "dubber", heading: "מדבבים", character: "קזאר" },
  { personName: "מיכה אוזין סליאן", role: "dubber", heading: "מדבבים", character: "בלאג" },
  { personName: "שי גולדשטיין", role: "dubber", heading: "מדבבים", character: "סוכן" },
  { personName: "דרור רפאל", role: "dubber", heading: "מדבבים", character: "סמוי" },
  { personName: "אסף קורמן", role: "dubber", heading: "מדבבים", character: "דיוק" },
  { personName: "מורן סופר", role: "dubber", heading: "מדבבים", character: "איזי" },
  { personName: "דוד קיגלר", role: "dubber", heading: "מדבבים", character: "מנחה פינגווין" },
  { personName: "אוהד שחר", role: "dubber", heading: "מדבבים", character: "חמיר" },
  { personName: "אסף פריינטא", role: "dubber", heading: "מדבבים", character: "סטן" },
  { personName: "יחזקאל לזרוב", role: "dubber", heading: "מדבבים", character: "קרמיין" },
  {
    personName: "מולי שולמן",
    role: "dubber",
    heading: "מדבבים",
    character: "סקרואו / פלמינגו / קולות רקע",
  },
  { personName: "גלעד קלטר", role: "dubber", heading: "מדבבים", character: "סקאב / פלמינגו" },
  {
    personName: "עידו מוסרי",
    role: "dubber",
    heading: "מדבבים",
    character: "שפן סלעים / דונלד",
  },
  {
    personName: "אודליה מורה מטלון",
    role: "dubber",
    heading: "מדבבים",
    character: "אמא היפופוטמית",
  },
  { personName: "גל ענבי", role: "dubber", heading: "מדבבים", character: "סמסון הצעיר" },
  { personName: "שמעון ישראלי", role: "dubber", heading: "מדבבים", character: "אבא של סמסון" },
  { personName: "אלברט כהן", role: "dubber", heading: "מדבבים", character: "מנהל מופע" },
  {
    personName: "סיון שביט",
    role: "dubber",
    heading: "מדבבים",
    character: 'חיפושית / בובת "קוצי קוצי" / היפופוטמית תינוקת',
  },
  { personName: "הדר שחף-מעיין", role: "dubber", heading: "מדבבים", character: "חיפושית" },
  { personName: "יגאל מזרחי", role: "dubber", heading: "מדבבים", character: "אווז / קרנף" },
  { personName: "עדי וייס", role: "dubber", heading: "מדבבים", character: "כרוז" },
  { personName: "יעל צדוק", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
  { personName: "לני כהן", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
  { personName: "נועה שמי", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
  { personName: "שרון כהן", role: "composer", heading: "מוזיקה" },
  { personName: "אופיר צמח", role: "singer", heading: "מקהלת גנואים" },
  { personName: "אסף פריינטא", role: "singer", heading: "מקהלת גנואים" },
  { personName: "יגאל מזרחי", role: "singer", heading: "מקהלת גנואים" },
  { personName: "עדי רז", role: "singer", heading: "מקהלת גנואים" },
  { personName: "עידו מוסרי", role: "singer", heading: "מקהלת גנואים" },
  { personName: "שרון כהן", role: "composer", heading: "ניהול מוזיקלי" },
];

const PRODUCTION: Production = {
  id: JUNGLE_CITY_2006_ID,
  title: TITLE,
  originalTitle: "The Wild",
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary:
    "ראיין בנו הקטן של סמסון האריה נוסע בטעות מניו יורק לאפריקה, ועכשיו סמסון וחבריו מגן החיות יוצאות להשיב אותו",
  genres: ["אנימציה", "ילדים", "מדובב - זר", "פנטזיה", "קומדיה"],
  channel: "הופ תמיר",
  runtimeMinutes: 94,
  imageUrl: portrait(TITLE, "The Wild"),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function sameTitle(title: string): boolean {
  return title.replace(/['׳]/g, "") === TITLE.replace(/['׳]/g, "");
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

/** ג'ונגל סיטי (2006) — The Wild — מעמוד הופ תמיר. */
export function applyIshimJungleCity2006(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const production = productions[i];
    const match =
      production.id === JUNGLE_CITY_2006_ID ||
      (sameTitle(production.title) && production.year === YEAR);
    if (!match) continue;
    if (production.id !== JUNGLE_CITY_2006_ID) duplicateIds.add(production.id);
    productions[i] = {
      ...production,
      ...PRODUCTION,
      id: JUNGLE_CITY_2006_ID,
      imageUrl: production.imageUrl || PRODUCTION.imageUrl,
      createdAt: production.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((production) => production.id === JUNGLE_CITY_2006_ID)) {
    productions.push(PRODUCTION);
  }

  const keptProductions = productions.filter(
    (production) =>
      production.id === JUNGLE_CITY_2006_ID || !duplicateIds.has(production.id)
  );

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map(
    people.map((person) => [normalizePersonName(person.name), person] as const)
  );

  const credits: Credit[] = assignBillingOrders(
    CREDITS.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: JUNGLE_CITY_2006_ID,
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
        if (credit.productionId === JUNGLE_CITY_2006_ID) return false;
        return !duplicateIds.has(credit.productionId);
      }),
      ...credits,
    ],
  };
}
