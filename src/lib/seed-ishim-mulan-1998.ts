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
/** Existing wave2 / dub-cast id — keep; merge archive ishim-mulan-1998 into it. */
export const MULAN_1998_ID = "mulan-he";
const ARCHIVE_ID = "ishim-mulan-1998";
const REPLACED_IDS = new Set([MULAN_1998_ID, ARCHIVE_ID]);
const TITLE = "מולאן";
const YEAR = 1998;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%9E%D7%95%D7%9C%D7%90%D7%9F-1998-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
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
  { personName: "רינת גבאי", role: "dubber", heading: "מדבבים", character: "מולאן" },
  { personName: "תומר שרון", role: "dubber", heading: "מדבבים", character: "מושו" },
  {
    personName: "ליאור אשכנזי",
    role: "dubber",
    heading: "מדבבים",
    character: "קפטן לי שאנג",
  },
  { personName: "חיים צינוביץ'", role: "dubber", heading: "מדבבים", character: "יאו" },
  { personName: "יוסי טולדו", role: "dubber", heading: "מדבבים", character: "לינג" },
  { personName: "ליאור זוהר", role: "dubber", heading: "מדבבים", character: "צ'יאן-פו" },
  { personName: "אוהד שחר", role: "dubber", heading: "מדבבים", character: "שאן-יו" },
  { personName: "יהודה אפרוני", role: "dubber", heading: "מדבבים", character: "פא-זו" },
  { personName: "יעל פרל בקר", role: "dubber", heading: "מדבבים", character: "פא-לי" },
  { personName: "נחמה הנדל", role: "dubber", heading: "מדבבים", character: "סבתא פא" },
  { personName: "נורית כהן", role: "dubber", heading: "מדבבים", character: "שדכנית" },
  {
    personName: "דב רייזר",
    role: "dubber",
    heading: "מדבבים",
    character: "אב קדמון / שומר חומה סינית",
  },
  {
    personName: "יהויכין פרידלנדר",
    role: "dubber",
    heading: "מדבבים",
    character: "צ'י-פו",
  },
  {
    personName: "איציק סיידוף",
    role: "dubber",
    heading: "מדבבים",
    character: "הקיסר / אחד מהאבות הקדמונים",
  },
  {
    personName: "ניר רון",
    role: "dubber",
    heading: "מדבבים",
    character: "הגנרל לי צ'ונג",
  },
  { personName: "דורון אורן", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
  {
    personName: "דבי בסרגליק",
    role: "dubber",
    heading: "מדבבים",
    character: "קולות רקע",
  },
  { personName: "מומי לוי", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
  {
    personName: "עפרון אטקין",
    role: "dubber",
    heading: "מדבבים",
    character: "קולות רקע",
  },
  {
    personName: "שמוליק טנא",
    role: "dubber",
    heading: "מדבבים",
    character: "אחד מהאבות הקדמונים",
  },
  { personName: "שפרירה זכאי", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
  { personName: "יהודית רביץ", role: "singer", heading: "מוזיקה", character: "שירה" },
  { personName: "יסמין גמליאל", role: "singer", heading: "מוזיקה", character: "שירה" },
  {
    personName: "מומי לוי",
    role: "singer",
    heading: "מוזיקה",
    character: "לינג (שירה)",
  },
  {
    personName: "רוני וייס",
    role: "singer",
    heading: "מוזיקה",
    character: "ניהול מוזיקלי",
  },
];

const PRODUCTION: Production = {
  id: MULAN_1998_ID,
  title: TITLE,
  originalTitle: "Mulan",
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary:
    "כדי להציל את אביה ממוות בצבא, נערה סינית מחליפה אותו מחופשת לגבר והופכת להיות אחת הגיבורים הגדולים של סין",
  genres: [
    "אנימציה",
    "דרמה",
    "ילדים",
    "מדובב - זר",
    "נוער",
    "קומדיה",
  ],
  runtimeMinutes: 90,
  ishimKeys: ["סדרת סרטים"],
  ishimNotes: [
    {
      heading: "מאחורי הקלעים",
      items: [
        "בישראל, הסרט יצא לאקרנים ביוני 1998, שלושה חודשים לפני מותה של הזמרת והבדרנית נחמה הנדל שדיבבה את סבתא פא",
      ],
    },
  ],
  imageUrl: portrait(TITLE, "Mulan"),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

/** 1998 Disney Hebrew dub only — not מולאן 2 (2005) and not מולאן (2021). */
function isThisFilm(production: Production): boolean {
  if (REPLACED_IDS.has(production.id)) return true;
  if (production.title !== TITLE) return false;
  if (production.year !== YEAR) return false;
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

function preferStoredImage(matches: Production[]): string | undefined {
  const http = matches.find(
    (production) =>
      production.imageUrl &&
      /^https?:\/\//i.test(production.imageUrl) &&
      !production.imageUrl.includes("/api/portrait") &&
      !production.imageUrl.includes("/api/wiki-image")
  );
  return (
    http?.imageUrl ||
    matches.find((production) => production.imageUrl)?.imageUrl
  );
}

/** מולאן (1998) — Mulan — מעמוד הופ תמיר. שומר mulan-he; לא נוגע במולאן 2 / 2021. */
export function applyIshimMulan1998(data: ArchiveData): ArchiveData {
  const matches = data.productions.filter(isThisFilm);
  const existing =
    matches.find((production) => production.id === MULAN_1998_ID) || matches[0];
  const duplicateIds = new Set(
    matches
      .map((production) => production.id)
      .filter((id) => id !== MULAN_1998_ID)
  );

  const record: Production = existing
    ? {
        ...existing,
        ...PRODUCTION,
        id: MULAN_1998_ID,
        imageUrl: preferStoredImage(matches) || PRODUCTION.imageUrl,
        createdAt: existing.createdAt || NOW,
        updatedAt: NOW,
      }
    : PRODUCTION;

  const productions = [
    ...data.productions.filter((production) => !isThisFilm(production)),
    record,
  ];

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map(
    people.map((person) => [normalizePersonName(person.name), person] as const)
  );

  const credits: Credit[] = assignBillingOrders(
    CREDITS.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: MULAN_1998_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: YEAR,
    }))
  );

  return {
    ...data,
    people,
    productions,
    credits: [
      ...data.credits.filter(
        (credit) =>
          credit.productionId !== MULAN_1998_ID &&
          !duplicateIds.has(credit.productionId)
      ),
      ...credits,
    ],
  };
}
