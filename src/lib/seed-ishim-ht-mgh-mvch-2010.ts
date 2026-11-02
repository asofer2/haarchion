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

const NOW = "2026-11-02T00:00:00.000Z";
export const MEGAMIND_2010_ID = "ht-mgh-mvch";
const TITLE = "מגה מוח";
const YEAR = 2010;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%9E%D7%92%D7%94-%D7%9E%D7%95%D7%97-2010-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

/** דמות→שם מעמוד הופ תמיר. */
const CREDITS: CreditRow[] = [
  { personName: "שרון כהן", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "הדס מוזס", role: "producer", heading: "הפקת דיבוב" },
  {
    personName: "יחזקאל לזרוב",
    role: "dubber",
    heading: "מדבבים",
    character: "מגה מוח / ברנרד / אבא מהחלל",
  },
  {
    personName: "הילה זיתון",
    role: "dubber",
    heading: "מדבבים",
    character: "רוקסן ריצ'י",
  },
  {
    personName: "עידו רוזנברג",
    role: "dubber",
    heading: "מדבבים",
    character: "משרתיון",
  },
  {
    personName: "מורדי גרשון",
    role: "dubber",
    heading: "מדבבים",
    character: "מטרו-מן",
  },
  {
    personName: "גיא רושיניאק",
    role: "dubber",
    heading: "מדבבים",
    character: "האל - טיטאן",
  },
  { personName: "יגאל שדה", role: "dubber", heading: "מדבבים", character: "סוהר" },
  {
    personName: "הדר שחף-מעיין",
    role: "dubber",
    heading: "מדבבים",
    character: "אמא של מגה מוח",
  },
  {
    personName: "אריה צ'רנר",
    role: "dubber",
    heading: "מדבבים",
    character: "אבא של מגה מוח",
  },
  {
    personName: "גלעד קלטר",
    role: "dubber",
    heading: "מדבבים",
    character: "אזרח אקראי",
  },
  {
    personName: "צביקה פורמן",
    role: "dubber",
    heading: "מדבבים",
    character: "אבא מאמץ של מטרו מן / כתב חדשות",
  },
  {
    personName: "שמחה ברבירו",
    role: "dubber",
    heading: "מדבבים",
    character: "ראש העיר",
  },
  {
    personName: "הילה מערבי",
    role: "dubber",
    heading: "מדבבים",
    character: "אמא מאמצת של מטרו מן / כתבת חדשות",
  },
  {
    personName: "שרון כהן",
    role: "dubber",
    heading: "מדבבים",
    character: "קולות רקע",
  },
  {
    personName: "דן קיזלר",
    role: "dubber",
    heading: "מדבבים",
    character: "קולות רקע",
  },
  {
    personName: "תום שוורצברג",
    role: "dubber",
    heading: "מדבבים",
    character: "קולות רקע",
  },
];

const PRODUCTION: Production = {
  id: MEGAMIND_2010_ID,
  title: TITLE,
  originalTitle: "Megamind",
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary:
    "נבל העל מגה מוח מביס את אויבו הנצחי, אך נשאר ללא תכלית. הוא מחליט ליצור גיבור על חדש שימשיך בקרב המסורתי",
  genres: [
    "אנימציה",
    "ילדים",
    "מדובב - זר",
    "מדע בדיוני",
    "נוער",
    "פעולה",
    "פשע",
    "קומדיה",
  ],
  runtimeMinutes: 96,
  ishimClassic: true,
  imageUrl: portrait(TITLE, "Megamind"),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function isThisShow(production: Production): boolean {
  if (production.id === MEGAMIND_2010_ID) return true;
  return production.title === TITLE && production.year === YEAR;
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

/** מגה מוח (2010) — מעמוד הופ תמיר. */
export function applyIshimMegamind2010(data: ArchiveData): ArchiveData {
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
      productionId: MEGAMIND_2010_ID,
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
