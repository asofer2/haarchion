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

const NOW = "2026-10-20T00:00:00.000Z";
export const BEAUTY_BEAST_1992_ID = "beauty-beast-he";
const REPLACED_IDS = new Set([BEAUTY_BEAST_1992_ID, "ishim-hyph-vhchyh-1992"]);
const TITLE = "היפה והחיה";
const YEAR = 1992;
const SOURCE_URL =
  "https://web.archive.org/web/20220115160640/https://www.ishim.co.il/m.php?s=%D7%94%D7%99%D7%A4%D7%94+%D7%95%D7%94%D7%97%D7%99%D7%94%231992";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

const CREDITS: CreditRow[] = [
  { personName: "שפרירה זכאי", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "שפרירה זכאי", role: "producer", heading: "הפקת דיבוב" },
  { personName: "רינת גבאי", role: "dubber", heading: "מדבבים", character: "בל" },
  { personName: "יובל זמיר", role: "dubber", heading: "מדבבים", character: "החיה / הנסיך" },
  { personName: "יגאל שדה", role: "dubber", heading: "מדבבים", character: "גסטון" },
  { personName: "אלי גורנשטיין", role: "dubber", heading: "מדבבים", character: "לומייר" },
  { personName: "דב רייזר", role: "dubber", heading: "מדבבים", character: "שעוני" },
  { personName: "רחל אטאס", role: "dubber", heading: "מדבבים", character: "גברת תיון" },
  { personName: "רונה דניאלי", role: "dubber", heading: "מדבבים", character: "צ'יפ" },
  { personName: "רותי הולצמן", role: "dubber", heading: "מדבבים", character: "שידה" },
  { personName: "לימור שפירא", role: "dubber", heading: "מדבבים", character: "אבקנית" },
  { personName: "אברהם מור", role: "dubber", heading: "מדבבים", character: "מוריס" },
  { personName: "אלון אופיר", role: "dubber", heading: "מדבבים", character: "לה-פו" },
  { personName: "אריאל פורמן", role: "dubber", heading: "מדבבים", character: "מספר / מונסיור ד'ארקו" },
  { personName: "איציק סיידוף", role: "dubber", heading: "מדבבים", character: "הספרן" },
  { personName: "יעקב בוך", role: "dubber", heading: "מדבבים", character: "האופה" },
  { personName: "עפרון אטקין", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
  { personName: "שפרירה זכאי", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
  { personName: "רוני וייס", role: "singer", heading: "מוזיקה", character: "ניהול מוזיקלי" },
  { personName: "יואל אקהרט", role: "singer", heading: "מוזיקה", character: "גסטון (קטעי שירה)" },
  { personName: "רונית כץ", role: "singer", heading: "מוזיקה", character: "מקהלה" },
  { personName: "רון גנג", role: "singer", heading: "מוזיקה", character: "מקהלה" },
  { personName: "רפי זליג", role: "singer", heading: "מוזיקה", character: "מקהלה" },
];

const PRODUCTION: Production = {
  id: BEAUTY_BEAST_1992_ID,
  title: TITLE,
  originalTitle: "Beauty and the Beast",
  year: YEAR,
  kind: "film_dubbed_foreign",
  summary: "בל, שאביה נתפס על ידי החיה, מציעה להישאר במקום אביה ומגלה את הנסיך שבתוך החיה",
  genres: ["אנימציה", "ילדים", "מוזיקלי", "קומדיה", "רומנטיקה"],
  runtimeMinutes: 84,
  ishimKeys: ["אהבה", "אוסקר", "סדרת סרטים", "ריקודים"],
  ishimNotes: [
    { heading: "כללי", items: ["קיים עוד היפה והחיה"] },
    {
      heading: "מאחורי הקלעים",
      items: ["בקטע אחד שנכלל בגרסת הסרט המורחב שיצאה בדיוידי ב-2002, אסף פריינטא דיבב את החיה"],
    },
    {
      heading: "קישורים",
      items: ["ראה גם היפה והחיה 3 - עולמה הקסום של בל", "ראה גם היפה והחיה 2 - חורף קסום"],
    },
    {
      heading: "טריוויה לא מעניינת",
      items: ["סרט האנימציה הראשון שהיה מועמד באוסקר בתור הסרט הטוב ביותר"],
    },
  ],
  ishimClassic: true,
  imageUrl: portrait(TITLE, "Beauty and the Beast"),
  entryAuthors: ["ברק חננאל", "Nir Bassan"],
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function coversYear(production: Production): boolean {
  const end = production.endYear ?? production.year;
  return production.year <= YEAR && YEAR <= end;
}

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "film" ? ["film"] : [activity, "film"];
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

/** היפה והחיה לפי עמוד אישים 1992. מחליף את ערך 1991 שכבר באתר. */
export function applyIshimBeautyBeast1992(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const production = productions[i];
    const match = REPLACED_IDS.has(production.id) || (production.title === TITLE && coversYear(production));
    if (!match) continue;
    if (production.id !== BEAUTY_BEAST_1992_ID) duplicateIds.add(production.id);
    productions[i] = {
      ...production,
      ...PRODUCTION,
      id: BEAUTY_BEAST_1992_ID,
      imageUrl: production.imageUrl || PRODUCTION.imageUrl,
      createdAt: production.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((production) => production.id === BEAUTY_BEAST_1992_ID)) {
    productions.push(PRODUCTION);
  }

  const keptProductions = productions.filter(
    (production) => production.id === BEAUTY_BEAST_1992_ID || !duplicateIds.has(production.id)
  );

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map(
    people.map((person) => [normalizePersonName(person.name), person] as const)
  );

  const credits: Credit[] = assignBillingOrders(
    CREDITS.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: BEAUTY_BEAST_1992_ID,
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
      ...data.credits.filter((credit) => {
        if (credit.productionId === BEAUTY_BEAST_1992_ID) return false;
        return !duplicateIds.has(credit.productionId);
      }),
      ...credits,
    ],
  };
}
