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

const NOW = "2026-10-18T00:00:00.000Z";
export const KESEM_HA_MAGI_ID = "ishim-ksm-hmgy";
const TITLE = "קסם המג'י";
const SOURCE_URL =
  "https://web.archive.org/web/20220113074753/https://www.ishim.co.il/m.php?s=%D7%A7%D7%A1%D7%9D+%D7%94%D7%9E%D7%92%27%D7%99";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
};

const CREDITS: CreditRow[] = [
  { personName: "אפי בן ישראל", role: "dub_director", heading: "בימוי דיבוב" },
  { personName: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
  { personName: "גיא פרידמן", role: "dubber", heading: "מדבבים", character: "טוני ג'ונס", year: 2008 },
  { personName: "לירון לב", role: "dubber", heading: "מדבבים", character: "טוני ג'ונס", year: 2011 },
  { personName: "אביטל אברג'ל", role: "dubber", heading: "מדבבים", character: "אידין" },
  { personName: "רועי שגב", role: "dubber", heading: "מדבבים", character: "סטראג'" },
  { personName: "צביקה פורמן", role: "dubber", heading: "מדבבים", character: "פורוק / אגראם" },
  { personName: "גיא רושיניאק", role: "dubber", heading: "מדבבים", character: "אגר" },
  { personName: "שמחה ברבירו", role: "dubber", heading: "מדבבים", character: "פריפ / סבא" },
  { personName: "רוברט הניג", role: "dubber", heading: "מדבבים", character: "אורווין" },
  { personName: "אפי בן ישראל", role: "dubber", heading: "מדבבים", character: "איבו" },
  { personName: "תומר גלר", role: "dubber", heading: "מדבבים", character: "זד" },
  { personName: "אלון שר", role: "dubber", heading: "מדבבים", character: "קורג" },
  { personName: "אסף ניב", role: "dubber", heading: "מדבבים אורחים", character: "דמויות אורחות", year: 2008 },
  { personName: "מאיה בר שלום", role: "dubber", heading: "מדבבים אורחים", character: "דמויות אורחות", year: 2011 },
  { personName: "שמרית לוי ששון", role: "dubber", heading: "מדבבים אורחים", character: "דמויות אורחות", year: 2008 },
  { personName: "אלי לולאי", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
];

const PRODUCTION: Production = {
  id: KESEM_HA_MAGI_ID,
  title: TITLE,
  originalTitle: "Magi Nation",
  year: 2008,
  endYear: 2011,
  kind: "series_dubbed_foreign",
  summary:
    "נער צעיר מכדור הארץ מוצא את עצמו בעולם קסום בו צריך להילחם בכוחות הרשע בעזרת יצורים מיוחדים וכוח החלום",
  genres: ["אנימציה", "ילדים", "מדובב - זר", "מתח", "נוער", "פנטזיה", "פעולה"],
  channel: "ערוץ הילדים",
  runtimeMinutes: 23,
  episodeCount: 51,
  ishimClassic: true,
  imageUrl: portrait(TITLE, "Magi Nation"),
  entryAuthors: ["ברק חננאל"],
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

/** קסם המג'י (2008–2011) מעמוד אישים בארכיון 13 בינואר 2022. */
export function applyIshimKesemHaMagi(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const production = productions[i];
    if (production.title !== TITLE && production.id !== KESEM_HA_MAGI_ID) continue;
    if (production.id !== KESEM_HA_MAGI_ID) duplicateIds.add(production.id);
    productions[i] = {
      ...production,
      ...PRODUCTION,
      id: KESEM_HA_MAGI_ID,
      imageUrl: production.imageUrl || PRODUCTION.imageUrl,
      createdAt: production.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((production) => production.id === KESEM_HA_MAGI_ID)) {
    productions.push(PRODUCTION);
  }

  const keptProductions = productions.filter(
    (production) => production.id === KESEM_HA_MAGI_ID || production.title !== TITLE
  );

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map(
    people.map((person) => [normalizePersonName(person.name), person] as const)
  );

  const credits: Credit[] = assignBillingOrders(
    CREDITS.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, people, byName, byId),
      productionId: KESEM_HA_MAGI_ID,
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
        if (credit.productionId === KESEM_HA_MAGI_ID) return false;
        if (duplicateIds.has(credit.productionId)) return false;
        const production = data.productions.find((item) => item.id === credit.productionId);
        return !production || production.title !== TITLE;
      }),
      ...credits,
    ],
  };
}
