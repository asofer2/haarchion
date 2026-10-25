import { assignBillingOrders } from "./credit-order";
import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import { ISHIM_CLASSIC_SOURCE, ishimWaybackPersonUrl } from "./ishim-import";
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

const NOW = "2026-10-25T07:46:00.000Z";
/**
 * Archive id for ספר הג'ונגל#ערוץ הילדים.
 * Other Jungle Book versions (1988, 1994, 2000, 2003, musicals) stay untouched.
 */
export const JUNGLE_BOOK_KIDS_ID = "ishim-spr-hgvngl-arvts-hyldym";
const TITLE = "ספר הג'ונגל";
const SOURCE_URL =
  "https://web.archive.org/web/20210519002052/https://www.ishim.co.il/m.php?s=%D7%A1%D7%A4%D7%A8+%D7%94%D7%92%27%D7%95%D7%A0%D7%92%D7%9C%23%D7%A2%D7%A8%D7%95%D7%A5+%D7%94%D7%99%D7%9C%D7%93%D7%99%D7%9D";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
  endYear?: number;
};

/** Cast from the 19 May 2021 Wayback page. character = role, years from the [brackets]. */
const CREDITS: CreditRow[] = [
  { personName: "אפי בן ישראל", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
  {
    personName: "איתי לוי",
    role: "dubber",
    heading: "מדבבים",
    character: "מוגלי",
    year: 2011,
  },
  {
    personName: "עומר שטיינברג",
    role: "dubber",
    heading: "מדבבים",
    character: "מוגלי",
    year: 2013,
    endYear: 2014,
  },
  { personName: "אלי לולאי", role: "dubber", heading: "מדבבים", character: "בגירה" },
  {
    personName: "דני בסן",
    role: "dubber",
    heading: "מדבבים",
    character: "בלו",
    year: 2011,
  },
  {
    personName: "מיכה אוזין סליאן",
    role: "dubber",
    heading: "מדבבים",
    character: "בלו",
    year: 2013,
    endYear: 2014,
  },
  {
    personName: "חנן רוזן",
    role: "dubber",
    heading: "מדבבים",
    character: "קא / הטי",
    year: 2011,
  },
  {
    personName: "יואב בר לב",
    role: "dubber",
    heading: "מדבבים",
    character: "אקלה / טבקי / או / דמויות שונות",
  },
  {
    personName: "אפי בן ישראל",
    role: "dubber",
    heading: "מדבבים",
    character: "רקשה / בו",
  },
  {
    personName: "מאי יעקובסון",
    role: "dubber",
    heading: "מדבבים",
    character: "ללי / פוניה",
    year: 2011,
  },
  {
    personName: "שירה קניספל",
    role: "dubber",
    heading: "מדבבים",
    character: "ללי",
    year: 2013,
    endYear: 2014,
  },
  {
    personName: "גיא רושיניאק",
    role: "dubber",
    heading: "מדבבים",
    character: "באלה / לואי / קא / דמויות שונות",
  },
  {
    personName: "מאיה בר שלום",
    role: "dubber",
    heading: "מדבבים",
    character: "דרזי / איקי / דמויות שונות",
  },
  { personName: "תומר גלר", role: "dubber", heading: "מדבבים", character: "פאונה" },
  {
    personName: "יורם יוספסברג",
    role: "dubber",
    heading: "מדבבים",
    character: "שירקן / הטי",
  },
];

const PRODUCTION: Production = {
  id: JUNGLE_BOOK_KIDS_ID,
  title: TITLE,
  year: 2011,
  endYear: 2014,
  kind: "series_dubbed_foreign",
  summary:
    "הרפתקאותיהם של גור האדם מוגלי וחבריו בגירה ובלו, המתמודדים מול סכנות שונות בג'ונגל, ומתעמתים עם שירקן הנמר",
  genres: ["אנימציה", "הרפתקאות", "ילדים", "מדובב - זר", "מוזיקלי", "פנטזיה", "פעולה"],
  channel: "ערוץ הילדים",
  runtimeMinutes: 11,
  episodeCount: 78,
  ishimKeys: ["מבוסס על ספר"],
  ishimNotes: [
    {
      heading: "מאחורי הקלעים",
      items: ["דני בסן דיבב את בלו הדוב גם בסרט ספר הג'ונגל 2"],
    },
    {
      heading: "שאלות ללא תשובות",
      items: ["מי שר את שיר הפתיחה?"],
    },
  ],
  ishimClassic: true,
  imageUrl: portrait(TITLE),
  entryAuthors: ["Yonatan Starobinsky", "ברק חננאל"],
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function isKidsChannelVersion(production: Production): boolean {
  if (production.id === JUNGLE_BOOK_KIDS_ID) return true;
  if (production.title !== TITLE) return false;
  return production.channel === "ערוץ הילדים";
}

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "series" ? ["series"] : [activity, "series"];
}

function stubPerson(name: string, role: CreditRole): Person {
  return {
    id: `ishim-${slugify(name) || "person"}`,
    name,
    nicknames: [],
    bio: "",
    tags: [],
    activities: activitiesFor(role),
    ishimClassic: true,
    sourceNote: ISHIM_CLASSIC_SOURCE,
    sourceUrl: ishimWaybackPersonUrl(name),
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

/** ספר הג'ונגל של ערוץ הילדים (2011–2014). לא נוגע בגרסאות שנה/ערוץ אחרות. */
export function applyIshimJungleBookKids(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const matches = productions.filter(isKidsChannelVersion);
  const primary = matches.find((production) => production.imageUrl) || matches[0];
  const id = primary?.id || JUNGLE_BOOK_KIDS_ID;
  const imageUrl =
    matches.map((production) => production.imageUrl).find((url) => Boolean(url)) ||
    PRODUCTION.imageUrl;
  const createdAt = primary?.createdAt || NOW;
  const dropIds = new Set(matches.map((production) => production.id));
  dropIds.add(id);

  const keptProductions = productions.filter((production) => !isKidsChannelVersion(production));
  keptProductions.push({
    ...PRODUCTION,
    id,
    imageUrl,
    createdAt,
    updatedAt: NOW,
  });

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map(
    people.map((person) => [normalizePersonName(person.name), person] as const)
  );

  const credits: Credit[] = assignBillingOrders(
    CREDITS.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: id,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year,
      endYear: row.endYear,
    }))
  );

  return {
    ...data,
    people,
    productions: keptProductions,
    credits: [
      ...data.credits.filter((credit) => !dropIds.has(credit.productionId)),
      ...credits,
    ],
  };
}
