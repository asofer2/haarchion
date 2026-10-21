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

const NOW = "2026-10-21T00:00:00.000Z";
export const BSKTYRS_ID = "ishim-bsktyrs";
const TITLE = "בסקטירס";
const SOURCE_URL =
  "https://web.archive.org/web/20191111195510/https://www.ishim.co.il/m.php?s=%D7%91%D7%A1%D7%A7%D7%98%D7%99%D7%A8%D7%A1";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
};

const CREDITS: CreditRow[] = [
  { personName: "ליאור סול", role: "dub_director", heading: "בימוי דיבוב", year: 2012 },
  { personName: "אפי בן ישראל", role: "dub_director", heading: "בימוי דיבוב", year: 2014 },
  { personName: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
  { personName: "עמית יוסוביץ'", role: "dubber", heading: "מדבבים", character: "רודי" },
  { personName: "שיר פרג", role: "dubber", heading: "מדבבים", character: "מיה" },
  { personName: "ספיר דרמון", role: "dubber", heading: "מדבבים", character: "סטלה" },
  {
    personName: "שחר קדוש",
    role: "dubber",
    heading: "מדבבים",
    character: "ליאו",
    year: 2012,
  },
  {
    personName: "עדן גמליאל",
    role: "dubber",
    heading: "מדבבים",
    character: "ליאו (עונה 2) / קירסטן / דמויות שונות",
  },
  {
    personName: "אלעד בהרב",
    role: "dubber",
    heading: "מדבבים",
    character: "מייק",
    year: 2012,
  },
  {
    personName: "סער בדישי",
    role: "dubber",
    heading: "מדבבים",
    character: "מייק",
    year: 2014,
  },
  { personName: "ערן מור", role: "dubber", heading: "מדבבים", character: "טוני פרקר" },
  { personName: "דור סרוגו", role: "dubber", heading: "מדבבים" },
  { personName: "טליה ברקאי", role: "dubber", heading: "מדבבים" },
  {
    personName: "יובל סגל",
    role: "dubber",
    heading: "מדבבים",
    character: "סלים / דמויות שונות",
    year: 2012,
  },
  {
    personName: "גיא רושיניאק",
    role: "dubber",
    heading: "מדבבים",
    character: "סלים / דמויות שונות",
    year: 2014,
  },
  {
    personName: "דיוויד לרנר",
    role: "dubber",
    heading: "מדבבים",
    character: "דוק / טים / דמויות שונות",
    year: 2012,
  },
  { personName: "דן קיזלר", role: "dubber", heading: "מדבבים", year: 2012 },
  {
    personName: "ברק ברויטמן",
    role: "dubber",
    heading: "מדבבים",
    character: "טרי / טרוי / דמויות שונות",
    year: 2012,
  },
  {
    personName: "רז וקנין",
    role: "dubber",
    heading: "מדבבים",
    character: "ג'יי / האלק / סנובול / דמויות שונות",
    year: 2012,
  },
  {
    personName: "יותם סחייק",
    role: "dubber",
    heading: "מדבבים",
    character: "ממבה / מורגאן / סמוז / פריז / דמויות שונות",
    year: 2012,
  },
  { personName: "מאיה בר שלום", role: "dubber", heading: "מדבבים", year: 2014 },
  { personName: "גדי לוי", role: "dubber", heading: "מדבבים", year: 2014 },
  { personName: "צביקה פורמן", role: "dubber", heading: "מדבבים", year: 2014 },
  {
    personName: "אלון שר",
    role: "singer",
    heading: "מוזיקה",
    character: "שיר פתיחה (ביצוע)",
  },
  {
    personName: "ליאור סול",
    role: "singer",
    heading: "מוזיקה",
    character: "ניהול מוזיקלי",
  },
];

const PRODUCTION: Production = {
  id: BSKTYRS_ID,
  title: TITLE,
  year: 2012,
  endYear: 2014,
  kind: "series_dubbed_foreign",
  summary:
    'קבוצת הכדורסל "היי פייב", בהדרכתו של טוני פרקר, נלחמים על המקום הראשון בטורניר ה"באסקאפ"',
  genres: ["אנימציה", "ילדים", "מדובב - זר"],
  channel: "ערוץ הילדים",
  runtimeMinutes: 24,
  episodeCount: 52,
  ishimKeys: ["כדורסל", "ספורט"],
  ishimClassic: true,
  imageUrl: portrait(TITLE),
  entryAuthors: [
    "Stephen Flynn",
    "ברק חננאל",
    "Barak Broitman",
    "David Lerner",
    "Yotam Sechayk",
    "Toval Israeli",
  ],
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: SOURCE_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

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

/** בסקטירס (2012–2014) מעמוד אישים בארכיון 11 בנובמבר 2019. */
export function applyIshimBsktyrs(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const production = productions[i];
    if (production.title !== TITLE && production.id !== BSKTYRS_ID) continue;
    if (production.id !== BSKTYRS_ID) duplicateIds.add(production.id);
    productions[i] = {
      ...production,
      ...PRODUCTION,
      id: BSKTYRS_ID,
      imageUrl: production.imageUrl || PRODUCTION.imageUrl,
      createdAt: production.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((production) => production.id === BSKTYRS_ID)) {
    productions.push(PRODUCTION);
  }

  const keptProductions = productions.filter(
    (production) => production.id === BSKTYRS_ID || production.title !== TITLE
  );

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map(
    people.map((person) => [normalizePersonName(person.name), person] as const)
  );

  const credits: Credit[] = assignBillingOrders(
    CREDITS.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: BSKTYRS_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year,
    }))
  );

  return {
    ...data,
    people,
    productions: keptProductions,
    credits: [
      ...data.credits.filter((credit) => {
        if (credit.productionId === BSKTYRS_ID) return false;
        if (duplicateIds.has(credit.productionId)) return false;
        const production = data.productions.find((item) => item.id === credit.productionId);
        return !production || production.title !== TITLE;
      }),
      ...credits,
    ],
  };
}
