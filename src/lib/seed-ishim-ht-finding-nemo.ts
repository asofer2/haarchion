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
/** Keep existing wave2 / dub-cast id. */
export const FINDING_NEMO_ID = "finding-nemo-he";
const TITLE = "מוצאים את נמו";
const YEAR = 2003;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%9E%D7%95%D7%A6%D7%90%D7%99%D7%9D-%D7%90%D7%AA-%D7%A0%D7%9E%D7%95-2003-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

/** שם→דמות מעמוד הופ תמיר. */
const CREDITS: CreditRow[] = [
  { personName: "שפרירה זכאי", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "שפרירה זכאי", role: "producer", heading: "הפקת דיבוב" },
  { personName: "ליאור זוהר", role: "dubber", heading: "מדבבים", character: "ברדג" },
  { personName: "רמה מסינגר", role: "dubber", heading: "מדבבים", character: "דוגי" },
  {
    personName: "אבינועם עמית יוסף",
    role: "dubber",
    heading: "מדבבים",
    character: "נמו",
  },
  { personName: "אוהד שחר", role: "dubber", heading: "מדבבים", character: "גיל" },
  {
    personName: "איציק סיידוף",
    role: "dubber",
    heading: "מדבבים",
    character: "גורג' / דולפין",
  },
  {
    personName: "מיכה אוזין סליאן",
    role: "dubber",
    heading: "מדבבים",
    character: "בלוני (האבונפחה) / נד",
  },
  { personName: "ליליאן ברטו", role: "dubber", heading: "מדבבים", character: "פיצי" },
  {
    personName: "דב רייזר",
    role: "dubber",
    heading: "מדבבים",
    character: "באבלס / שקנאי / קולות רקע",
  },
  {
    personName: "סיון שביט",
    role: "dubber",
    heading: "מדבבים",
    character: "דבי / קוראז'",
  },
  {
    personName: "אלי גורנשטיין",
    role: "dubber",
    heading: "מדבבים",
    character: "ז'אק / מר ריי",
  },
  {
    personName: "שמעון כהן",
    role: "dubber",
    heading: "מדבבים",
    character: "נייג'ל / מנהיג דגי סלמון",
  },
  {
    personName: "עמי מנדלמן",
    role: "dubber",
    heading: "מדבבים",
    character: "קראש / קולות רקע",
  },
  { personName: "עומר ברנד", role: "dubber", heading: "מדבבים", character: "צבי" },
  {
    personName: "יורם יוספסברג",
    role: "dubber",
    heading: "מדבבים",
    character: "ברוס / לובסטר / דג אפור",
  },
  {
    personName: "עפרון אטקין",
    role: "dubber",
    heading: "מדבבים",
    character: "עוגן / ביל / רופא שיניים / דג חרב",
  },
  {
    personName: "זיו מאיר",
    role: "dubber",
    heading: "מדבבים",
    character: "תורן / בוב / סרטן ירוק / קולות רקע",
  },
  {
    personName: "שירלי ורטהיימר",
    role: "dubber",
    heading: "מדבבים",
    character: "דארלה / פרל",
  },
  { personName: "מיקי ילון", role: "dubber", heading: "מדבבים", character: "טד" },
  {
    personName: "אלכסנדר לוין",
    role: "dubber",
    heading: "מדבבים",
    character: "שלדון",
  },
  {
    personName: "שפרירה זכאי",
    role: "dubber",
    heading: "מדבבים",
    character: "ברברה",
  },
  {
    personName: "יעל עמית",
    role: "dubber",
    heading: "מדבבים",
    character: "קולות רקע",
  },
];

const PRODUCTION: Production = {
  id: FINDING_NEMO_ID,
  title: TITLE,
  originalTitle: "Finding Nemo",
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary:
    "דג אלמן ודגה עם בעיות זכרון יוצאים לחפש את בנו נמו שנחטף על ידי דייגים",
  genres: ["אנימציה", "דרמה", "ילדים", "מדובב - זר", "מתח", "קומדיה"],
  runtimeMinutes: 95,
  ishimKeys: ["ים"],
  ishimClassic: true,
  ishimNotes: [
    {
      heading: "קישורים",
      items: ["ראה סרט המשך מוצאים את דורי"],
    },
  ],
  imageUrl: portrait(TITLE, "Finding Nemo"),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function isThisShow(production: Production): boolean {
  if (production.id === FINDING_NEMO_ID) return true;
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

/** מוצאים את נמו (2003) — מעמוד הופ תמיר. */
export function applyIshimFindingNemo(data: ArchiveData): ArchiveData {
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
      productionId: FINDING_NEMO_ID,
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
