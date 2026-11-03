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

const NOW = "2026-11-03T00:00:00.000Z";

/** פינוקיו של דיסני — הדף הקלאסי הוא 1993, לא 1995 ולא 2023. */
export const PINOCCHIO_DISNEY_1993_ID = "ishim-pynvkyv-dysny";
/** זמן דיסני — רצועה בערוץ 2, 1993–2002. */
export const DISNEY_TIME_ID = "ishim-zmn-dysny";

const PINOCCHIO_SOURCE =
  "https://web.archive.org/web/20210727214221/https://www.ishim.co.il/m.php?s=%D7%A4%D7%99%D7%A0%D7%95%D7%A7%D7%99%D7%95%23%D7%93%D7%99%D7%A1%D7%A0%D7%99";
const DISNEY_TIME_SOURCE =
  "https://web.archive.org/web/20210816030706/https://www.ishim.co.il/m.php?s=%D7%96%D7%9E%D7%9F+%D7%93%D7%99%D7%A1%D7%A0%D7%99";
const SOURCE_NOTE = "אישים";

export const PINOCCHIO_DISNEY_1993: Production = {
  id: PINOCCHIO_DISNEY_1993_ID,
  title: "פינוקיו",
  originalTitle: "Pinocchio",
  year: 1993,
  kind: "film_dubbed_foreign",
  summary:
    "בובה חיה חייב להוכיח לעצמו בעזרתו של צרצר בתור המצפון שלו שהוא ראוי להיות ילד אמיתי",
  genres: ["אנימציה", "ילדים", "מדובב - זר", "מוזיקלי", "פנטזיה"],
  channel: "דיסני",
  runtimeMinutes: 88,
  ishimClassic: true,
  imageUrl: portrait("פינוקיו", "Pinocchio", { kind: "film" }),
  sourceNote: SOURCE_NOTE,
  sourceUrl: PINOCCHIO_SOURCE,
  createdAt: NOW,
  updatedAt: NOW,
};

export const DISNEY_TIME: Production = {
  id: DISNEY_TIME_ID,
  title: "זמן דיסני",
  year: 1993,
  endYear: 2002,
  kind: "tv_program",
  summary: "רצועת שידורים המבוססת על מיטב תוכניות הטלוויזיה של דיסני",
  genres: ["אנימציה", "מדובב - זר", "פנטזיה"],
  channel: "ערוץ 2",
  runtimeMinutes: 60,
  ishimClassic: true,
  ishimNotes: [
    {
      heading: "במסגרת התוכנית",
      items: [
        "שודרו אגדות ברווזים, השכונה של גופי, עולם סחרחר, בת הים הקטנה, אלאדין, טימון ופומבה, דונלד דאק וצוות קוואק, הגרגולים, הרפתקאות פו הדוב, באז שנות אור ממפקדת הכוכב ו-101 דלמטים: הסדרה",
      ],
    },
  ],
  imageUrl: portrait("זמן דיסני", "Disney Afternoon", { kind: "film" }),
  sourceNote: SOURCE_NOTE,
  sourceUrl: DISNEY_TIME_SOURCE,
  createdAt: NOW,
  updatedAt: NOW,
};

type Narrator = { name: string; year: number; endYear: number };

export const DISNEY_TIME_NARRATORS: Narrator[] = [
  { name: "שפרירה זכאי", year: 1993, endYear: 1995 },
  { name: "מיכאל הנגבי", year: 1993, endYear: 1995 },
  { name: "רונה דניאלי", year: 1993, endYear: 1995 },
  { name: "אסף כחולי", year: 1993, endYear: 1995 },
  { name: "דורון בן עמי", year: 1993, endYear: 1995 },
  { name: "ליליאן ברטו", year: 1997, endYear: 1998 },
];

const PINOCCHIO_DUBBERS: { name: string; character: string }[] = [
  { name: "גיל סגל", character: "פינוקיו" },
  { name: "ישראל גוריון", character: "ג'ימיני" },
  { name: "אברהם מור", character: "סבא ג'פטו" },
  { name: "לימור שפירא", character: "הפיה הכחולה" },
  { name: "מיכאל הנגבי", character: "לאמפוויק" },
  { name: "אוהד שחר", character: "ג'ון הישר" },
  { name: "שמעון כהן", character: "סטרומבולי" },
  { name: "יובל זמיר", character: "העגלון" },
  { name: "גיל זמק", character: "קולות רקע" },
  { name: "יובל סגל", character: "קולות רקע" },
  { name: "שרית וינו אלעד", character: "קולות רקע" },
  { name: "תומר שרון", character: "קולות רקע" },
];

export function isPhantomPinocchio2023(production: Production): boolean {
  return production.title === "פינוקיו" && production.year === 2023;
}

export function isDisneyPinocchio1993(production: Production): boolean {
  if (production.id === PINOCCHIO_DISNEY_1993_ID) return true;
  if (production.id === "pinocchio-he") return false;
  if (production.title !== "פינוקיו") return false;
  if (production.year !== 1993 && production.year !== 1995) return false;
  return (
    production.channel === "דיסני" ||
    production.id.endsWith("-dysny") ||
    production.id === "ishim-pynvkyv"
  );
}

export function isPinocchio2022(production: Production): boolean {
  return production.title === "פינוקיו" && production.year === 2022;
}

export function isDisneyTime(production: Production): boolean {
  return production.id === DISNEY_TIME_ID || production.title === "זמן דיסני";
}

function samePerson(a: string, b: string): boolean {
  return (
    normalizePersonName(canonicalPersonName(a)) ===
    normalizePersonName(canonicalPersonName(b))
  );
}

function narratorFor(name: string): Narrator | undefined {
  return DISNEY_TIME_NARRATORS.find((row) => samePerson(row.name, name));
}

export type ClassicCreditInput = {
  role: CreditRole;
  heading?: string;
  year?: number;
  title: string;
  character?: string;
  s?: string;
  channel?: string;
};

export type ClassicCreditFix = {
  skip: boolean;
  production?: Production;
  role: CreditRole;
  heading?: string;
  year?: number;
  endYear?: number;
  character?: string;
};

/** תיקון שורת קרדיט מדף אישים קלאסי, לפני שהיא נשמרת בדף האדם. */
export function adjustClassicIshimCredit(
  personName: string,
  credit: ClassicCreditInput
): ClassicCreditFix {
  const base: ClassicCreditFix = {
    skip: false,
    role: credit.role,
    heading: credit.heading,
    year: credit.year,
    character: credit.character,
  };
  if (credit.title === "פינוקיו" && credit.year === 2023) {
    return { ...base, skip: true };
  }

  const disneyPinocchio =
    credit.s === "פינוקיו#דיסני" ||
    (credit.title === "פינוקיו" && credit.channel === "דיסני");
  const shapiraSongOn2022 =
    samePerson(personName, "שפרירה זכאי") &&
    credit.title === "פינוקיו" &&
    (credit.s === "פינוקיו#2022" || credit.year === 2022) &&
    credit.role === "singer";

  if (disneyPinocchio || shapiraSongOn2022) {
    const listed = PINOCCHIO_DUBBERS.find((row) =>
      samePerson(row.name, personName)
    )?.character;
    const shapira = samePerson(personName, "שפרירה זכאי");
    const roni = samePerson(personName, "רוני וייס");
    const song = shapiraSongOn2022 || (shapira && credit.role === "singer");
    const heading = song || roni
      ? "מוזיקה"
      : credit.role === "dub_director"
        ? "בימוי דיבוב"
        : credit.role === "producer"
          ? "הפקת דיבוב"
          : credit.heading || "מדבבים";
    const character = song
      ? "תרגום שירים"
      : roni
        ? "ניהול מוזיקלי"
        : credit.role === "dub_director" || credit.role === "producer"
          ? undefined
          : listed;
    return {
      skip: false,
      production: PINOCCHIO_DISNEY_1993,
      role: song ? "singer" : credit.role,
      heading,
      year: 1993,
      character,
    };
  }

  if (credit.title === "זמן דיסני" || credit.s === "זמן דיסני") {
    const narrator = narratorFor(personName);
    if (narrator) {
      return {
        skip: false,
        production: DISNEY_TIME,
        role: "host",
        heading: "קריינות",
        year: narrator.year,
        endYear: narrator.endYear,
      };
    }
    return { ...base, production: DISNEY_TIME };
  }

  return base;
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
    tags: ["דיבוב"],
    activities: activitiesFor(role),
    sourceNote: SOURCE_NOTE,
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
  const existing = byName.get(normalizePersonName(canonicalPersonName(name)));
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

function upsertProduction(
  productions: Production[],
  next: Production,
  matches: (production: Production) => boolean
): { productions: Production[]; replacedIds: Set<string> } {
  const found = productions.filter(matches);
  const replacedIds = new Set(
    found.map((production) => production.id).filter((id) => id !== next.id)
  );
  const previous = found.find((production) => production.id === next.id) || found[0];
  const record: Production = previous
    ? {
        ...previous,
        ...next,
        id: next.id,
        imageUrl: previous.imageUrl || next.imageUrl,
        createdAt: previous.createdAt || next.createdAt,
        updatedAt: NOW,
      }
    : next;
  return {
    productions: [
      ...productions.filter((production) => !matches(production)),
      record,
    ],
    replacedIds,
  };
}

/**
 * פינוקיו (דיסני, 1993) וזמן דיסני (1993–2002).
 * מוחק ערך פינוקיו 2023 אם נוצר, ומעביר את תרגום השירים של שפרירה זכאי ל־1993.
 */
export function applyIshimDisney1993Fixes(data: ArchiveData): ArchiveData {
  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map<string, Person>();
  for (const person of people) {
    byName.set(normalizePersonName(person.name), person);
    byName.set(normalizePersonName(canonicalPersonName(person.name)), person);
  }

  let productions = data.productions;
  const pinocchio = upsertProduction(
    productions,
    PINOCCHIO_DISNEY_1993,
    isDisneyPinocchio1993
  );
  productions = pinocchio.productions;
  const disneyTime = upsertProduction(productions, DISNEY_TIME, isDisneyTime);
  productions = disneyTime.productions;
  const phantomIds = new Set(
    productions.filter(isPhantomPinocchio2023).map((production) => production.id)
  );
  productions = productions.filter((production) => !isPhantomPinocchio2023(production));

  const replacedIds = new Set<string>([
    PINOCCHIO_DISNEY_1993_ID,
    DISNEY_TIME_ID,
    ...pinocchio.replacedIds,
    ...disneyTime.replacedIds,
    ...phantomIds,
  ]);
  const pinocchio2022Ids = new Set(
    productions.filter(isPinocchio2022).map((production) => production.id)
  );

  const shapiraId = resolvePersonId(
    "שפרירה זכאי",
    "dub_director",
    people,
    byName,
    byId
  );

  const pinocchioRows: {
    personName: string;
    role: CreditRole;
    heading: string;
    character?: string;
  }[] = [
    { personName: "שפרירה זכאי", role: "dub_director", heading: "בימוי דיבוב" },
    { personName: "שפרירה זכאי", role: "producer", heading: "הפקת דיבוב" },
    ...PINOCCHIO_DUBBERS.map((row) => ({
      personName: row.name,
      role: "dubber" as const,
      heading: "מדבבים",
      character: row.character,
    })),
    {
      personName: "שפרירה זכאי",
      role: "singer",
      heading: "מוזיקה",
      character: "תרגום שירים",
    },
    {
      personName: "רוני וייס",
      role: "singer",
      heading: "מוזיקה",
      character: "ניהול מוזיקלי",
    },
  ];

  const pinocchioCredits: Credit[] = assignBillingOrders(
    pinocchioRows.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: PINOCCHIO_DISNEY_1993_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: 1993,
    }))
  );

  const disneyCastIds = new Set(pinocchioCredits.map((credit) => credit.personId));
  const otherPinocchioIds = new Set(
    productions
      .filter(
        (production) =>
          production.title === "פינוקיו" && production.id !== PINOCCHIO_DISNEY_1993_ID
      )
      .map((production) => production.id)
  );

  const kept = data.credits.filter((credit) => {
    if (replacedIds.has(credit.productionId) || phantomIds.has(credit.productionId)) {
      return false;
    }
    if (
      credit.personId === shapiraId &&
      credit.role === "singer" &&
      pinocchio2022Ids.has(credit.productionId)
    ) {
      return false;
    }
    // הדיבוב של 1995 נדבק בטעות לסדרת 1990. הוא שייך לפינוקיו 1993.
    if (
      credit.year === 1995 &&
      otherPinocchioIds.has(credit.productionId) &&
      disneyCastIds.has(credit.personId)
    ) {
      return false;
    }
    return true;
  });

  const disneyTimeCredits: Credit[] = assignBillingOrders(
    DISNEY_TIME_NARRATORS.map((row) => ({
      personId: resolvePersonId(row.name, "host", people, byName, byId),
      productionId: DISNEY_TIME_ID,
      role: "host" as const,
      heading: "קריינות",
      year: row.year,
      endYear: row.endYear,
    }))
  );

  return {
    ...data,
    people,
    productions,
    credits: [...kept, ...pinocchioCredits, ...disneyTimeCredits],
  };
}
