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
/** Existing archive / search id for «באג לייף» (1998). */
export const BAG_LYYF_ID = "ishim-bag-lyyf";
const TITLE = "באג לייף";
const YEAR = 1998;
const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%91%D7%90%D7%92-%D7%9C%D7%99%D7%99%D7%A3-1998-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
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
  { personName: "תומר שרון", role: "dubber", heading: "מדבבים", character: "פליק" },
  { personName: "שרון שחל", role: "dubber", heading: "מדבבים", character: "הנסיכה אטה" },
  { personName: "שירלי ורטהיימר", role: "dubber", heading: "מדבבים", character: "דוט" },
  { personName: "תיקי דיין", role: "dubber", heading: "מדבבים", character: "המלכה" },
  { personName: "אלון אופיר", role: "dubber", heading: "מדבבים", character: "פרנסיס" },
  { personName: "חן אלון", role: "dubber", heading: "מדבבים", character: "היימליך" },
  { personName: "יוסי טולדו", role: "dubber", heading: "מדבבים", character: "סלים" },
  {
    personName: "רמה מסינגר",
    role: "dubber",
    heading: "מדבבים",
    character: "רוזי / מלצרית",
  },
  { personName: "יהודה אפרוני", role: "dubber", heading: "מדבבים", character: "מאני" },
  { personName: "ליליאן ברטו", role: "dubber", heading: "מדבבים", character: "ג'יפסי" },
  {
    personName: "דור צויגנבום",
    role: "dubber",
    heading: "מדבבים",
    character: "חגב / סליקי",
  },
  { personName: "גיל זמק", role: "dubber", heading: "מדבבים", character: "דים" },
  { personName: "אייל ברטונוב", role: "dubber", heading: "מדבבים", character: "פי.טי." },
  { personName: "יובל זמיר", role: "dubber", heading: "מדבבים", character: "הופר" },
  {
    personName: "עפרון אטקין",
    role: "dubber",
    heading: "מדבבים",
    character: "מולט / קולות רקע",
  },
  {
    personName: "דב רייזר",
    role: "dubber",
    heading: "מדבבים",
    character: "מר סויל / חגבי",
  },
  { personName: "שפרירה זכאי", role: "dubber", heading: "מדבבים", character: "ד\"ר פלורה" },
  {
    personName: "שמעון כהן",
    role: "dubber",
    heading: "מדבבים",
    character: "קוצי / זבוב",
  },
  {
    personName: "שמוליק טנא",
    role: "dubber",
    heading: "מדבבים",
    character: "קורנליוס / זבוב / חגב",
  },
  { personName: "גיל סגל", role: "dubber", heading: "מדבבים", character: "נמלון" },
  { personName: "יסמין עיון", role: "dubber", heading: "מדבבים", character: "נמלית" },
  { personName: "חן חגי", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
  { personName: "שמחה ברבירו", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
];

const PRODUCTION: Production = {
  id: BAG_LYYF_ID,
  title: TITLE,
  originalTitle: "A Bug's Life",
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary:
    "נמלת זכר לא יוצלח מחפש לוחמים שיצילו את המושבה שלו מהחגבים, אבל הלוחמים שהוא מוצא הם למעשי לולייני קרקס",
  genres: [
    "אנימציה",
    "ילדים",
    "מדובב - זר",
    "פנטזיה",
    "פעולה",
    "קומדיה",
  ],
  runtimeMinutes: 96,
  imageUrl: portrait(TITLE, "A Bug's Life"),
  sourceNote: SOURCE_NOTE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function isThisFilm(production: Production): boolean {
  if (production.id === BAG_LYYF_ID) return true;
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

/** באג לייף (1998) — A Bug's Life — מעמוד הופ תמיר. מעדכן את ishim-bag-lyyf. */
export function applyIshimBagLyyf(data: ArchiveData): ArchiveData {
  const matches = data.productions.filter(isThisFilm);
  const existing = matches[0];
  const duplicateIds = new Set(
    matches.map((production) => production.id).filter((id) => id !== BAG_LYYF_ID)
  );

  const record: Production = existing
    ? {
        ...existing,
        ...PRODUCTION,
        id: BAG_LYYF_ID,
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
      productionId: BAG_LYYF_ID,
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
          credit.productionId !== BAG_LYYF_ID &&
          !duplicateIds.has(credit.productionId)
      ),
      ...credits,
    ],
  };
}
