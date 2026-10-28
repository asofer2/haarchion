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
/** ויפו הכלב המעופף (2008) — מעמוד הופ תמיר; מחליף ערך ארכיון אישים חלקי. */
export const VIPO_2008_ID = "ht-vypv-hklb-hmavpf";
const TITLE = "ויפו הכלב המעופף";
const YEAR = 2008;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%95%D7%99%D7%A4%D7%95-%D7%94%D7%9B%D7%9C%D7%91-%D7%94%D7%9E%D7%A2%D7%95%D7%A4%D7%A3-2008-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

/**
 * עמוד הופ תמיר: רוב הצוות שם→דמות בעמודה אחת.
 * שרית וינו אלעד בעמודה ימנית מול «נאקומה» (שמאל); «קוקואם» לבד בלי שם מדבב — לא נכלל.
 */
const CREDITS: CreditRow[] = [
  { personName: "ליאור סול", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
  { personName: "דניאל מגון", role: "dubber", heading: "מדבבים", character: "ויפו" },
  { personName: "לירון כרקוקלי", role: "dubber", heading: "מדבבים", character: "בטי" },
  { personName: "גיא רושיניאק", role: "dubber", heading: "מדבבים", character: "הנרי" },
  { personName: "יובל דור", role: "dubber", heading: "מדבבים", character: "קריין" },
  { personName: "אורלי קטן", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
  { personName: "אלי לולאי", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
  { personName: "אתי קסטרו", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
  { personName: "רועי שגב", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
  {
    personName: "שרית וינו אלעד",
    role: "dubber",
    heading: "מדבבים",
    character: "נאקומה",
  },
];

const PRODUCTION: Production = {
  id: VIPO_2008_ID,
  title: TITLE,
  originalTitle: "Vipo: Adventures of the Flying Dog",
  year: YEAR,
  kind: "series_dubbed_foreign",
  summary:
    "כלב מעופף יוצא למסע הרפתקאות ברחבי העולם יחד עם חבריו בטי חתולת הצעצוע והנרי החסידה",
  genres: ["אנימציה", "חינוכי", "ילדים", "מדובב - זר", "פנטזיה"],
  channel: "הופ!",
  runtimeMinutes: 15,
  episodeCount: 26,
  ishimKeys: ["חתול", "כלב"],
  ishimClassic: true,
  imageUrl: portrait(TITLE, "Vipo: Adventures of the Flying Dog"),
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

function isThisShow(production: Production): boolean {
  if (production.id === VIPO_2008_ID) return true;
  if (production.id === "ishim-vypv-hklb-hmavpf") return true;
  if (production.year !== YEAR) return false;
  return normTitle(production.title) === TITLE;
}

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "series" ? ["series"] : [activity, "series"];
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

/** ויפו הכלב המעופף (2008) — מעמוד הופ תמיר. */
export function applyIshimVipo2008(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  let imageUrl: string | undefined;
  let createdAt: string | undefined;

  for (const production of productions) {
    if (!isThisShow(production)) continue;
    if (production.imageUrl) imageUrl = imageUrl || production.imageUrl;
    if (production.createdAt) createdAt = createdAt || production.createdAt;
  }

  const keptProductions = productions.filter((production) => !isThisShow(production));
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
      productionId: VIPO_2008_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: YEAR,
    }))
  );

  const replacedIds = new Set(
    productions.filter(isThisShow).map((production) => production.id)
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
