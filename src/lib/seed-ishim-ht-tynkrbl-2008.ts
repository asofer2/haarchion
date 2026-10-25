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
/** טינקרבל 2008 בלבד. לא טינקרבל והאוצר האבוד (2009) ולא טינקרבל והסוד הקסום (2010). */
export const TINKER_BELL_2008_ID = "ht-tynkrbl-2008";
const TITLE = "טינקרבל";
const YEAR = 2008;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%98%D7%99%D7%A0%D7%A7%D7%A8%D7%91%D7%9C-2008-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

/**
 * עמודה שמאלית = דמות/תפקיד, עמודה ימנית = שם.
 * «סיון שבי.ט» בעמוד מקושר לאישים כסיון שביט.
 * «פיה» היא שורת מדבבים אחרונה; כותרת מוזיקה מתחילה אחריה.
 */
const CREDITS: CreditRow[] = [
  { personName: "אפרת ענבל", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "שירי רוזנברג", role: "producer", heading: "הפקת דיבוב" },
  { personName: "מירב פלדמן", role: "dubber", heading: "מדבבים", character: "טינקרבל" },
  { personName: "סיון שביט", role: "dubber", heading: "מדבבים", character: "רוזטה" },
  { personName: "עדי קוזלובסקי", role: "dubber", heading: "מדבבים", character: "אירידסה" },
  { personName: "לורן סביר", role: "dubber", heading: "מדבבים", character: "סילברמיסט" },
  { personName: "מיכל רשף", role: "dubber", heading: "מדבבים", character: "פוון" },
  { personName: "שרית וינו אלעד", role: "dubber", heading: "מדבבים", character: "הפיה מרי" },
  { personName: "לירון לב", role: "dubber", heading: "מדבבים", character: "טרנס" },
  {
    personName: "שמחה ברבירו",
    role: "dubber",
    heading: "מדבבים",
    character: "קלאנק / שר הסתיו",
  },
  { personName: "מולי שולמן", role: "dubber", heading: "מדבבים", character: "בובל" },
  { personName: "שמרית לוסטיג", role: "dubber", heading: "מדבבים", character: "וידיה" },
  { personName: "יעל עמית", role: "dubber", heading: "מדבבים", character: "המלכה קלריון" },
  { personName: "דב רייזר", role: "dubber", heading: "מדבבים", character: "שר האביב" },
  { personName: "עירית נתן בנדק", role: "dubber", heading: "מדבבים", character: "שרת החורף" },
  { personName: "דינה דורון", role: "dubber", heading: "מדבבים", character: "שרת הקיץ" },
  { personName: "יעל פרימר", role: "dubber", heading: "מדבבים", character: "קריינית" },
  { personName: "יעל שמי", role: "dubber", heading: "מדבבים", character: "ונדי דארלינג" },
  {
    personName: "הדר שחף-מעיין",
    role: "dubber",
    heading: "מדבבים",
    character: "גברת דארלינג / פיות שונות",
  },
  { personName: "דן קיזלר", role: "dubber", heading: "מדבבים", character: "פיה" },
  {
    personName: "שרון עזריה",
    role: "singer",
    heading: "מוזיקה",
    character: "שירים (ביצוע)",
  },
  {
    personName: "שרון כהן",
    role: "singer",
    heading: "מוזיקה",
    character: "ניהול מוזיקלי",
  },
];

const PRODUCTION: Production = {
  id: TINKER_BELL_2008_ID,
  title: TITLE,
  originalTitle: "Tinker Bell",
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary: "סיפורה של הפיה טינקרבל עוד לפני שפגשה את פיטר פן",
  genres: ["אנימציה", "ילדים", "מדובב - זר", "מוזיקלי", "פנטזיה"],
  runtimeMinutes: 78,
  ishimNotes: [
    { heading: "קישורים", items: ["ראה סרט ההמשך טינקרבל והאוצר האבוד"] },
  ],
  ishimClassic: true,
  imageUrl: portrait(TITLE, "Tinker Bell", { kind: "film" }),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function normTitle(title: string): string {
  return title
    .replace(/\s*\(\s*2008\s*\)\s*/g, " ")
    .replace(/אישים/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isThisFilm(production: Production): boolean {
  if (production.id === TINKER_BELL_2008_ID) return true;
  if (production.year !== YEAR) return false;
  return normTitle(production.title) === TITLE;
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

/** טינקרבל (2008) — Tinker Bell — מעמוד הופ תמיר. לא נוגע בסרטי טינקרבל משנים אחרות. */
export function applyIshimTinkerBell2008(data: ArchiveData): ArchiveData {
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
      productionId: TINKER_BELL_2008_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: YEAR,
    }))
  );

  const replacedIds = new Set(
    productions.filter(isThisFilm).map((production) => production.id)
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
