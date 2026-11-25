import { canonicalPersonName } from "./aliases";
import { assignBillingOrders } from "./credit-order";
import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import { portrait } from "./portrait";
import type {
  ActivityCategory,
  ArchiveData,
  CreditRole,
  Person,
  Production,
} from "./types";
import { roleToActivity } from "./types";

const NOW = "2026-11-25T00:00:00.000Z";
const SOURCE_NOTE = "ערוץ הופ תמיר";
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%A8%D7%95%D7%91%D7%95%D7%98%D7%A1-2005-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const TITLE = "רובוטס";
const YEAR = 2005;
export const ROBOTS_ID = "ishim-rvbvts";

type Row = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

const CREDITS: Row[] = [
  { personName: "נינה אמיר", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "אלה אלדר", role: "producer", heading: "הפקת דיבוב" },
  { personName: "אמי בכר", role: "producer", heading: "הפקת דיבוב" },
  { personName: "גילי בכר", role: "producer", heading: "הפקת דיבוב" },
  { personName: "דן שפירא", role: "dubber", heading: "מדבבים", character: "רודני קופרבוטם" },
  { personName: "ינון כהן", role: "dubber", heading: "מדבבים", character: "רודני (בן 5)" },
  { personName: "איטן גרינברג", role: "dubber", heading: "מדבבים", character: "רודני (בן 10)" },
  { personName: "איל כהן", role: "dubber", heading: "מדבבים", character: "רודני (בן 12)" },
  { personName: "יובל דור", role: "dubber", heading: "מדבבים", character: "הרב קופרבוטם" },
  { personName: "חגית דסברג", role: "dubber", heading: "מדבבים", character: "לידיה קופרבוטם" },
  { personName: "טל פרידמן", role: "dubber", heading: "מדבבים", character: "פנדר" },
  { personName: "נועה קשפיצקי", role: "dubber", heading: "מדבבים", character: "פייפר" },
  { personName: "ניר רון", role: "dubber", heading: "מדבבים", character: "לאג" },
  { personName: "דדי זהר", role: "dubber", heading: "מדבבים", character: "קראנק" },
  { personName: "לימור שפירא", role: "dubber", heading: "מדבבים", character: "דודה פאני" },
  { personName: "טוביה צפיר", role: "dubber", heading: "מדבבים", character: "ביג וולד" },
  { personName: "שרון שחל", role: "dubber", heading: "מדבבים", character: "קאפי" },
  { personName: "יובל סגל", role: "dubber", heading: "מדבבים", character: "טים" },
  { personName: "שי זורניצר", role: "dubber", heading: "מדבבים", character: "ראצ'ט" },
  { personName: "דב רייזר", role: "dubber", heading: "מדבבים", character: "מאדאם גסקט" },
  { personName: "עמי ויינברג", role: "dubber", heading: "מדבבים", character: "מר גאנק" },
  { personName: "עלמה זק", role: "dubber", heading: "מדבבים", character: "לורטה" },
  { personName: "חנן גולדבלט", role: "dubber", heading: "מדבבים", character: "רובוט דואר" },
  { personName: "גיל קומר", role: "dubber", heading: "מדבבים", character: "כרוז" },
  { personName: "הדר אמיר", role: "dubber", heading: "מדבבים", character: "רובוטים ילדים" },
  { personName: "רוברט הניג", role: "dubber", heading: "מדבבים", character: "ג'ק האמר" },
  { personName: "אורנה כץ", role: "dubber", heading: "מדבבים", character: "רובוטית זקנה" },
  { personName: "גיל וסרמן", role: "dubber", heading: "מדבבים", character: "רובוטים שונים" },
  { personName: "גלעד קלטר", role: "dubber", heading: "מדבבים", character: "רובוטים שונים" },
  { personName: "דור צויגנבום", role: "dubber", heading: "מדבבים", character: "רובוט קטן בגוף פח זבל" },
  { personName: "דניאל מגון", role: "dubber", heading: "מדבבים", character: "רובוטים שונים" },
  {
    personName: "יהויכין פרידלנדר",
    role: "dubber",
    heading: "מדבבים",
    character: "רובוט מזמין משקה / רובוט טלפון / רובוט מוכר שעוני יד",
  },
  {
    personName: "יורם יוספסברג",
    role: "dubber",
    heading: "מדבבים",
    character: "רובוט מזרקה / רובוט ירוק עם לסת",
  },
  {
    personName: "נורית בנאי קורן",
    role: "dubber",
    heading: "מדבבים",
    character: "רובוטית כרוז מעלית / רובוטית חסרת ברגים",
  },
  { personName: "עידו מוסרי", role: "dubber", heading: "מדבבים", character: "רובוטים שונים" },
  {
    personName: "עמי מנדלמן",
    role: "dubber",
    heading: "מדבבים",
    character: "רובוט נהג מכונית / רובוט עצבני",
  },
  {
    personName: "עפרון אטקין",
    role: "dubber",
    heading: "מדבבים",
    character: "אבא של ראצ'ט / רובוט איש הפח / רובוטים שונים",
  },
  {
    personName: "רמי ברוך",
    role: "dubber",
    heading: "מדבבים",
    character: "רובוט מוכר גלידה / רובוט ראש משאית",
  },
];

const PRODUCTION: Production = {
  id: ROBOTS_ID,
  title: TITLE,
  originalTitle: "Robots",
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary:
    "בעולם של רובוטים, ממציא אידיאלי צעיר נוסע לעיר הגדולה להצטרף לחברה שאת ההשראה הוא קיבל אותה ממנה",
  genres: ["אנימציה", "ילדים", "מדובב - זר", "מדע בדיוני", "נוער", "פנטזיה", "קומדיה"],
  runtimeMinutes: 91,
  ishimClassic: true,
  imageUrl: portrait(TITLE, "Robots"),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

export function robotsProduction(title: string, year?: number): Production | undefined {
  if (title !== TITLE) return undefined;
  if (year && year !== YEAR) return undefined;
  return PRODUCTION;
}

export function robotsHopCharacter(
  name: string,
  role?: CreditRole
): string | undefined {
  if (role && role !== "dubber" && role !== "singer") return undefined;
  return CREDITS.find(
    (row) => row.personName === name && (!role || row.role === role)
  )?.character;
}

function isThisFilm(production: Production): boolean {
  if (production.id === ROBOTS_ID) return true;
  return production.title === TITLE && production.year === YEAR;
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
    bio: "",
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
  const key = normalizePersonName(canonicalPersonName(name));
  const existing = key ? byName.get(key) : undefined;
  if (existing) return existing.id;
  let person = stubPerson(name, role);
  if (byId.has(person.id) && byId.get(person.id)!.name !== person.name) {
    person = { ...person, id: `${person.id}-2` };
  }
  if (!byId.has(person.id)) {
    people.push(person);
    byId.set(person.id, person);
    byName.set(normalizePersonName(person.name), person);
  }
  return person.id;
}

/** רובוטס (2005) — מעמוד הופ תמיר. */
export function applyIshimRobots2005(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const found = productions.filter(isThisFilm);
  const previous = found.find((production) => production.id === ROBOTS_ID) || found[0];
  const kept = productions.filter((production) => !isThisFilm(production));
  kept.push({
    ...PRODUCTION,
    imageUrl: previous?.imageUrl || PRODUCTION.imageUrl,
    createdAt: previous?.createdAt || NOW,
    updatedAt: NOW,
  });

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map<string, Person>();
  for (const person of people) {
    byName.set(normalizePersonName(person.name), person);
    byName.set(normalizePersonName(canonicalPersonName(person.name)), person);
    for (const nick of person.nicknames || []) {
      const nickKey = normalizePersonName(nick);
      if (nickKey && !byName.has(nickKey)) byName.set(nickKey, person);
    }
  }

  const replaced = new Set(found.map((production) => production.id));
  const credits = assignBillingOrders(
    CREDITS.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: ROBOTS_ID,
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
      ...data.credits.filter((credit) => !replaced.has(credit.productionId)),
      ...credits,
    ],
  };
}
