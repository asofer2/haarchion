import { assignBillingOrders } from "./credit-order";
import { slugify } from "./ids";
import { ISHIM_CLASSIC_SOURCE } from "./ishim-import";
import type {
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
  ProductionKind,
} from "./types";

const NOW = "2026-10-18T00:00:00.000Z";
export const GUY_FRIEDMAN_ID = "guy-friedman";
const SOURCE_URL =
  "https://web.archive.org/web/20211218111535/https://www.ishim.co.il/p.php?s=%D7%92%D7%99%D7%90+%D7%A4%D7%A8%D7%99%D7%93%D7%9E%D7%9F";

type Row = {
  role: CreditRole;
  heading: string;
  year: number;
  title: string;
  character?: string;
};

const ROWS: Row[] = [
  { role: "actor", heading: "שחקן", year: 2019, title: "שקזום", character: "דוד אוסקר" },
  { role: "actor", heading: "שחקן", year: 2017, title: "מותק הטרול הקסום", character: "אבא" },
  { role: "actor", heading: "שחקן", year: 2017, title: "יש לי חג עם רינת וחברים", character: "גיא" },
  { role: "actor", heading: "שחקן", year: 2016, title: "גיבורי האור - עושים ניסים ונפלאות", character: "יהודה המכבי" },
  { role: "actor", heading: "שחקן", year: 2016, title: "מגילת אסתר", character: "מרדכי היהודי" },
  { role: "actor", heading: "שחקן", year: 2015, title: "שורום זורום", character: "גיא" },
  { role: "actor", heading: "שחקן", year: 2014, title: "החוף של רינת", character: "גיא" },
  { role: "actor", heading: "שחקן", year: 2014, title: "פנטזיה אלף לילה ולילה", character: "הנסיך" },
  { role: "actor", heading: "שחקן", year: 2013, title: "פנטזיה", character: "גיא" },
  { role: "actor", heading: "שחקן", year: 2012, title: "הגרוטאה של גיא ויויו", character: "גיא" },
  { role: "actor", heading: "שחקן", year: 2011, title: "מותק של פסטיבל 4", character: "גיא" },
  { role: "actor", heading: "שחקן", year: 2010, title: "השירים המשחקים", character: "גיא" },
  { role: "actor", heading: "שחקן", year: 2010, title: "גינת הפלאים של רינת", character: "שושן" },
  { role: "actor", heading: "שחקן", year: 2010, title: "מותק של פסטיבל 3", character: "דודידו" },
  { role: "actor", heading: "שחקן", year: 2009, title: "רינת גבאי בעולם האגדות" },
  { role: "actor", heading: "שחקן", year: 2009, title: "מלכת קסמים", character: "גיא" },
  { role: "actor", heading: "שחקן", year: 2009, title: "מותק של פסטיבל 2", character: "גיא" },
  { role: "actor", heading: "שחקן", year: 2008, title: "אצלנו בחצר", character: "גיא" },
  { role: "actor", heading: "שחקן", year: 2006, title: "טולי בלבולי בממלכת המוזיקה", character: "סטקאטו" },
  { role: "actor", heading: "שחקן", year: 2006, title: "טולי בלבולי בארץ פטפטת", character: "טריקי הרובוט" },
  { role: "actor", heading: "שחקן", year: 2005, title: "המרחב המוגן של הופ", character: "דודידו" },
  { role: "actor", heading: "שחקן", year: 2005, title: "דפנה ודודידו", character: "דודידו" },
  { role: "actor", heading: "שחקן", year: 2004, title: "פרפר נחמד", character: "גיא" },
  { role: "actor", heading: "שחקן", year: 1999, title: "רחוב סומסום - שארע סימסים", character: "קיפי בן קיפוד" },
  { role: "actor", heading: "שחקן", year: 1998, title: "אולפן החופש הגדול", character: "קיפי בן קיפוד" },
  { role: "actor", heading: "שחקן", year: 1997, title: "חסמב\"ה - המחזמר", character: "משה ירחמיאל" },
  { role: "actor", heading: "שחקן", year: 1997, title: "גומות החן של זוהר", character: "אלוהים" },
  { role: "actor", heading: "שחקן", year: 1996, title: "עליסה בארץ הפלאות", character: "החתול" },
  { role: "actor", heading: "שחקן", year: 1995, title: "דגדוגים - שירי משחק ראשונים", character: "יונתן הקטן" },
  { role: "actor", heading: "בתפקיד עצמו", year: 2016, title: "פיצוחים 50", character: "משתתף" },
  { role: "dubber", heading: "מדבב", year: 2009, title: "היה היה - דואגים לכדור הארץ" },
  { role: "dubber", heading: "מדבב", year: 2008, title: "קסם המג'י", character: "טוני ג'ונס" },
  { role: "dubber", heading: "מדבב", year: 2005, title: "אגדות אנדרסן", character: "דמויות שונות" },
  { role: "dubber", heading: "מדבב", year: 2002, title: "הרפתקאותיו של טוב טוב הגמד" },
  { role: "dubber", heading: "מדבב", year: 2000, title: "ד\"ר סוס", character: "נורטון הפיל" },
  { role: "dubber", heading: "מדבב", year: 2000, title: "חוות סוסי הפוני", character: "טומי" },
  { role: "dubber", heading: "מדבב", year: 1998, title: "בסל הבובות", character: "דובי" },
  { role: "singer", heading: "מוזיקה", year: 2016, title: "סינדרלה", character: "לחנים" },
  { role: "singer", heading: "מוזיקה", year: 2016, title: "מועדון המאפים הטובים", character: "מילים ולחנים לשירים" },
  { role: "singer", heading: "מוזיקה", year: 2009, title: "רינת גבאי בעולם האגדות", character: "מילים ולחנים לשירים" },
];

function kindFor(title: string, role: CreditRole): ProductionKind {
  if (title.includes("המחזמר")) return "musical";
  if (role === "dubber") return "series_dubbed_foreign";
  return "tv_series";
}

function covers(production: Production, year: number): boolean {
  const end = production.endYear ?? production.year;
  return production.year <= year && year <= end;
}

function newProduction(title: string, year: number, role: CreditRole): Production {
  return {
    id: `ishim-${slugify(title) || "prod"}`,
    title,
    year,
    kind: kindFor(title, role),
    summary: "",
    genres: [],
    ishimClassic: true,
    sourceNote: ISHIM_CLASSIC_SOURCE,
    sourceUrl: SOURCE_URL,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function resolveProduction(
  row: Row,
  productions: Production[],
  byId: Map<string, Production>
): string {
  const exact = productions.filter((production) => production.title === row.title);
  const inRange = exact.filter((production) => covers(production, row.year));
  const ranged = inRange.find((production) => production.year === row.year) || inRange[0];
  if (ranged) return ranged.id;

  const near = exact.filter((production) => Math.abs(production.year - row.year) === 1);
  if (near.length === 1) return near[0]!.id;

  const created = newProduction(row.title, row.year, row.role);
  let id = created.id;
  if (byId.has(id)) id = `${created.id}-${row.year}`;
  if (!byId.has(id)) {
    productions.push({ ...created, id });
    byId.set(id, { ...created, id });
  }
  return id;
}

/** גיא פרידמן לפי עמוד אישים בארכיון 18 בדצמבר 2021. */
export function applyIshimGuyFriedman(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const byId = new Map(productions.map((production) => [production.id, production]));
  const credits: Credit[] = assignBillingOrders(
    ROWS.map((row) => ({
      personId: GUY_FRIEDMAN_ID,
      productionId: resolveProduction(row, productions, byId),
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year,
    }))
  );

  const patch: Partial<Person> = {
    activities: ["acting", "dubbing", "musical", "series"],
    bio: "",
    birthDate: undefined,
    gender: "male",
    ishimClassic: true,
    entryAuthors: ["תמיר סופר", "Gal Talmon"],
    sourceNote: ISHIM_CLASSIC_SOURCE,
    sourceUrl: SOURCE_URL,
    updatedAt: NOW,
  };

  let found = false;
  const people = data.people.map((person) => {
    if (person.id !== GUY_FRIEDMAN_ID && person.name !== "גיא פרידמן") return person;
    found = true;
    return { ...person, ...patch, id: GUY_FRIEDMAN_ID };
  });
  if (!found) {
    people.push({
      id: GUY_FRIEDMAN_ID,
      name: "גיא פרידמן",
      nicknames: [],
      tags: [],
      bio: "",
      activities: ["acting", "dubbing", "musical", "series"],
      gender: "male",
      ishimClassic: true,
      entryAuthors: ["תמיר סופר", "Gal Talmon"],
      sourceNote: ISHIM_CLASSIC_SOURCE,
      sourceUrl: SOURCE_URL,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  return {
    ...data,
    people,
    productions,
    credits: [
      ...data.credits.filter((credit) => credit.personId !== GUY_FRIEDMAN_ID),
      ...credits,
    ],
  };
}
