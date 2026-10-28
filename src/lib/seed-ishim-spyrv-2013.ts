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

const NOW = "2026-10-28T00:00:00.000Z";
/** ספירו (2013) בלבד. לא ספירו ופנטזיו (2007–2009). */
export const SPYRV_2013_ID = "ishim-spyrv";
const TITLE = "ספירו";
const YEAR = 2013;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%A1%D7%A4%D7%99%D7%A8%D7%95-2013";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

/**
 * זיווג דמות↔מדבב לפי מיקומי DOM בעמוד הופ תמיר (עמודה ימנית יותר = שם, שמאלית = דמות).
 * עמי מנדלמן באותה שורה עם «המאמן מוזל» לפני כותרת מדבבים אורחים.
 */
const CREDITS: CreditRow[] = [
  { personName: "אפי בן ישראל", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
  { personName: "עדי ביטי", role: "dubber", heading: "מדבבים", character: "ספירו" },
  { personName: "דיוויד לרנר", role: "dubber", heading: "מדבבים", character: "ורג'יל" },
  { personName: "רום קלטר", role: "dubber", heading: "מדבבים", character: "קרסיוס" },
  {
    personName: "לורן סביר",
    role: "dubber",
    heading: "מדבבים",
    character: "מאסטר / גברת גומרדין / דמויות שונות",
  },
  { personName: "דולב סלע", role: "dubber", heading: "מדבבים", character: "מאנצ'לוט" },
  {
    personName: "דניאל רובינשטיין",
    role: "dubber",
    heading: "מדבבים",
    character: "סוזט",
  },
  { personName: "ניקי סטיוארט", role: "dubber", heading: "מדבבים", character: "רולט" },
  {
    personName: "יהלי ניב ושלר",
    role: "dubber",
    heading: "מדבבים",
    character: "אלינור",
  },
  {
    personName: "ברק ברויטמן",
    role: "dubber",
    heading: "מדבבים",
    character: "ליאופולד",
  },
  {
    personName: "תמיר סופר",
    role: "dubber",
    heading: "מדבבים",
    character: "סבא / קפטן מאג'ימקס / דמויות שונות",
  },
  {
    personName: "הדר שחף-מעיין",
    role: "dubber",
    heading: "מדבבים",
    character: "אמא / גברת בריינר / דמויות שונות",
  },
  {
    personName: "אורלי קטן",
    role: "dubber",
    heading: "מדבבים",
    character: "סבתא / גברת קאוטור / מרי / דמויות שונות",
  },
  {
    personName: "סער בדישי",
    role: "dubber",
    heading: "מדבבים",
    character: "ג'ים בריינר / המנהל סיילם / דמויות שונות",
  },
  {
    personName: "עמי מנדלמן",
    role: "dubber",
    heading: "מדבבים",
    character: "המאמן מוזל / דמויות שונות",
  },
  {
    personName: "שמחה ברבירו",
    role: "dubber",
    heading: "מדבבים אורחים",
    character: "נבל בסרט של מאג'ימקס (פרק 1)",
  },
];

const PRODUCTION: Production = {
  id: SPYRV_2013_ID,
  title: TITLE,
  year: YEAR,
  kind: "series_dubbed_foreign",
  summary:
    "ספירו הקטן, הילד עם תלבושת נער מעלית מסתבך בצרות רבות ומנסה לפתור את בעיותיו על ידי תעלולים.",
  genres: ["אנימציה", "ילדים", "מדובב - זר", "קומדיה"],
  channel: "ערוץ הילדים",
  runtimeMinutes: 10,
  episodeCount: 78,
  ishimClassic: true,
  imageUrl: portrait(TITLE),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function isThisSeries(production: Production): boolean {
  if (production.id === SPYRV_2013_ID) return true;
  if (production.title !== TITLE) return false;
  return production.year === YEAR;
}

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "series" ? ["series"] : [activity, "series"];
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

/** ספירו (2013) — מעמוד הופ תמיר. לא נוגע בספירו ופנטזיו. */
export function applyIshimSpirou2013(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  let imageUrl: string | undefined;
  let createdAt: string | undefined;
  const replacedIds = new Set<string>();

  for (const production of productions) {
    if (!isThisSeries(production)) continue;
    replacedIds.add(production.id);
    if (production.imageUrl) imageUrl = imageUrl || production.imageUrl;
    if (production.createdAt) createdAt = createdAt || production.createdAt;
  }

  const keptProductions = productions.filter((production) => !isThisSeries(production));
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
      productionId: SPYRV_2013_ID,
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
      ...data.credits.filter((credit) => !replacedIds.has(credit.productionId)),
      ...credits,
    ],
  };
}
