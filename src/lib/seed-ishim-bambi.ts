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

const NOW = "2026-11-07T00:00:00.000Z";
const SOURCE_NOTE = "אישים";

export const BAMBI_ID = "ishim-bmby";
export const BAMBI2_ID = "ishim-bmby-2";

const BAMBI_URL =
  "https://web.archive.org/web/20211104055358/https://www.ishim.co.il/m.php?s=%D7%91%D7%9E%D7%91%D7%99";
const BAMBI2_URL =
  "https://web.archive.org/web/20220114173015/https://www.ishim.co.il/m.php?s=%D7%91%D7%9E%D7%91%D7%99+2";

type Row = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

function dub(name: string, character?: string): Row {
  return { personName: name, role: "dubber", heading: "מדבבים", character };
}
function crew(name: string, role: CreditRole, heading: string): Row {
  return { personName: name, role, heading };
}
function music(name: string, character: string): Row {
  return { personName: name, role: "singer", heading: "מוזיקה", character };
}

const BAMBI: Production = {
  id: BAMBI_ID,
  title: "במבי",
  originalTitle: "Bambi",
  year: 1993,
  kind: "film_dubbed_foreign",
  summary:
    "סיפורו של עופר קטן וצעיר המתחיל ללמוד לשרוד את סכנות הטבע לאחר שאמו נורתה",
  genres: [
    "אנימציה",
    "דרמה",
    "ילדים",
    "מדובב - זר",
    "מוזיקלי",
    "מתח",
    "פנטזיה",
  ],
  runtimeMinutes: 70,
  ishimKeys: ["טרגדיה"],
  ishimNotes: [
    {
      heading: "טריוויה לא מעניינת",
      items: ["הסרט הוקרן לראשונה בארצות הברית בשנת 1942"],
    },
  ],
  ishimClassic: true,
  imageUrl: portrait("במבי", "Bambi"),
  sourceNote: SOURCE_NOTE,
  sourceUrl: BAMBI_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

const BAMBI_CREDITS: Row[] = [
  crew("שפרירה זכאי", "dub_director", "בימוי דיבוב"),
  crew("שפרירה זכאי", "producer", "הפקת דיבוב"),
  dub("יעל לוי", "במבי התינוק"),
  dub("דורין פרימור", "במבי הצעיר"),
  dub("אלון אופיר", "במבי המתבגר"),
  dub("לימור שפירא", "אמא של במבי"),
  dub("רונה דניאלי", "טמפר הצעיר"),
  dub("חן חגי", "טמפר המתבגר"),
  dub("אסתי קוסוביצקי", "אמא של טמפר"),
  dub("עדי דותן", "פרח הצעיר"),
  dub("אסף כחולי", "פרח המתבגר"),
  dub("דניאל ויינברג", "פלין הצעירה"),
  dub("מיכל ינאי", "פלין המתבגרת"),
  dub("אוהד שחר", "ינשוף"),
  dub("דב רייזר", "הנסיך הגדול של היער"),
  dub("עפרון אטקין"),
  dub("גיל זמק"),
  dub("שוש מרציאנו"),
  dub("שירלי טפר"),
  dub("גאיה טראוב"),
  dub("דיאל יולזרי"),
  dub("אלה בן דוד"),
  dub("שפרירה זכאי"),
  music("רוני וייס", "ניהול מוזיקלי"),
  music("יובל זמיר", "שירה"),
  music("לימור שפירא", "שירה"),
];

const BAMBI2: Production = {
  id: BAMBI2_ID,
  title: "במבי 2",
  year: 2006,
  kind: "film_dubbed_foreign",
  summary:
    "במבי, אייל נסיך צעיר ,שאיבד את אמו מגלה שאביו הוא הנסיך הגדול של היער",
  genres: ["אנימציה", "ילדים", "מדובב - זר"],
  runtimeMinutes: 72,
  ishimClassic: true,
  imageUrl: portrait("במבי 2", "Bambi II"),
  sourceNote: SOURCE_NOTE,
  sourceUrl: BAMBI2_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

const BAMBI2_CREDITS: Row[] = [
  crew("שפרירה זכאי", "dub_director", "בימוי דיבוב"),
  crew("שפרירה זכאי", "producer", "הפקת דיבוב"),
  dub("איתמר פרידלנדר", "במבי"),
  dub("דב רייזר", "הנסיך הגדול"),
  dub("גיא קרסנר", "טמפר"),
  dub("אבינועם עמית יוסף", "פרח"),
  dub("ליאנה עיון", "פאלין"),
  dub("עומר ברנד", "רונו"),
  dub("שירה זמק", "האחיות של טמפר"),
  dub("אבי חדש", "קיפוד / מרמיטה"),
  dub("אוהד שחר", "ינשוף"),
  dub("לימור שפירא", "אמא של במבי / מינה"),
  dub("מומי לוי", "קולות רקע"),
  dub("עמי מנדלמן", "קולות רקע"),
  dub("שפרירה זכאי", "קולות רקע"),
  dub("שרונה נסטוביץ'", "קולות רקע"),
  music("טלי אורן", "שירה"),
  music("מאי מלר", "שירה"),
  music("מיה גולדשמיט", "שירה"),
  music("רוני וייס", "ניהול מוזיקלי"),
];

function isBambi(production: Production): boolean {
  return production.title.trim() === "במבי";
}

function isBambi2(production: Production): boolean {
  return production.title.trim() === "במבי 2";
}

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "film" ? ["film"] : [activity, "film"];
}

function stubPerson(name: string, role: CreditRole, sourceUrl: string): Person {
  const canonical = canonicalPersonName(name);
  return {
    id: `ht-${slugify(canonical) || "person"}`,
    name: canonical,
    nicknames: [],
    bio: "",
    tags: ["דיבוב", "אישים"],
    activities: activitiesFor(role),
    sourceNote: SOURCE_NOTE,
    sourceUrl,
    imageUrl: portrait(canonical),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function resolvePersonId(
  name: string,
  role: CreditRole,
  sourceUrl: string,
  people: Person[],
  byName: Map<string, Person>,
  byId: Map<string, Person>
): string {
  const key = normalizePersonName(canonicalPersonName(name));
  const existing = key ? byName.get(key) : undefined;
  if (existing) return existing.id;
  let person = stubPerson(name, role, sourceUrl);
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

function replaceProduction(
  productions: Production[],
  next: Production,
  matches: (production: Production) => boolean
): { productions: Production[]; replacedIds: Set<string> } {
  const found = productions.filter(matches);
  const replacedIds = new Set(found.map((production) => production.id));
  const previous =
    found.find((production) => production.id === next.id) || found[0];
  const imageUrl = found.find((production) => production.imageUrl)?.imageUrl;
  const createdAt = found.find((production) => production.createdAt)?.createdAt;
  const record: Production = previous
    ? {
        ...previous,
        ...next,
        id: next.id,
        imageUrl: imageUrl || next.imageUrl,
        createdAt: createdAt || next.createdAt,
        updatedAt: NOW,
      }
    : next;
  return {
    productions: [...productions.filter((production) => !matches(production)), record],
    replacedIds,
  };
}

function creditsFor(
  rows: Row[],
  production: Production,
  people: Person[],
  byName: Map<string, Person>,
  byId: Map<string, Person>
): Credit[] {
  return assignBillingOrders(
    rows.map((row) => ({
      personId: resolvePersonId(
        row.personName,
        row.role,
        production.sourceUrl || "",
        people,
        byName,
        byId
      ),
      productionId: production.id,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: production.year,
    }))
  );
}

/** במבי (1993) ובמבי 2 (2006) — מיזוג הערך הכפול וקרדיטים מדפי אישים. */
export function applyIshimBambi(data: ArchiveData): ArchiveData {
  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map<string, Person>();
  for (const person of people) {
    byName.set(normalizePersonName(person.name), person);
    byName.set(normalizePersonName(canonicalPersonName(person.name)), person);
    for (const nick of person.nicknames || []) {
      const key = normalizePersonName(nick);
      if (key && !byName.has(key)) byName.set(key, person);
    }
  }

  const bambi = replaceProduction(data.productions, BAMBI, isBambi);
  const bambi2 = replaceProduction(bambi.productions, BAMBI2, isBambi2);
  const replacedIds = new Set<string>([
    ...bambi.replacedIds,
    ...bambi2.replacedIds,
    BAMBI_ID,
    BAMBI2_ID,
  ]);

  return {
    ...data,
    people,
    productions: bambi2.productions,
    credits: [
      ...data.credits.filter((credit) => !replacedIds.has(credit.productionId)),
      ...creditsFor(BAMBI_CREDITS, BAMBI, people, byName, byId),
      ...creditsFor(BAMBI2_CREDITS, BAMBI2, people, byName, byId),
    ],
  };
}
