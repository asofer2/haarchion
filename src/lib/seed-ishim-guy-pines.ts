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

const NOW = "2026-11-04T00:00:00.000Z";
export const GUY_PINES_ID = "gya-pyns";
const SOURCE_URL =
  "https://web.archive.org/web/20210120041954/https://www.ishim.co.il/p.php?s=%D7%92%D7%99%D7%90+%D7%A4%D7%99%D7%A0%D7%A1";

type Row = {
  role: CreditRole;
  heading: string;
  year: number;
  title: string;
  character?: string;
};

const FILMS = new Set([
  "כפולה",
  "גיבור אמיתי",
  "בת אל הבתולה",
  "פוראבר",
  "הבועה",
  "פיק אפ",
  "שוטטות",
  "הפחדנים",
]);

/** גיא פינס לפי עמוד אישים בארכיון 20 בינואר 2021. */
const ROWS: Row[] = [
  { role: "producer", heading: "מפיק", year: 2008, title: "ערב טוב" },
  { role: "producer", heading: "עורך", year: 2021, title: "שובר קופות", character: "עורך אחראי" },
  { role: "producer", heading: "עורך", year: 2021, title: "ערב טוב עם גיא פינס" },
  { role: "producer", heading: "עורך", year: 2016, title: "הכל אבוד עם טל פרידמן" },
  { role: "producer", heading: "עורך", year: 2014, title: "שעת הדרקון" },
  { role: "producer", heading: "עורך", year: 2007, title: "שניים" },
  { role: "producer", heading: "עורך", year: 1997, title: "איתי ורבותיי" },
  { role: "writer", heading: "יוצר", year: 2007, title: "שניים" },
  { role: "actor", heading: "שחקן", year: 2020, title: "כפולה", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2019, title: "גיבור אמיתי", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2019, title: "בת אל הבתולה", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2019, title: "פוראבר", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2018, title: "קופה ראשית", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2018, title: "יש לה את זה", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2018, title: "צומת מילר", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2017, title: "לצבי יש בעיה", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2017, title: "בית הכלבים", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2017, title: "החברים של נאור", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2016, title: "Oboy", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2016, title: "סופשלי", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2016, title: "הרוסים", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2013, title: "בננות", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2013, title: "להיות איתה", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2013, title: "החממה", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2013, title: "הפיג'מות", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2010, title: "מתלהבת", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2009, title: "רמזור", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2007, title: "24/7 - תום אבני", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2006, title: "הבועה", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2005, title: "פיק אפ", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2002, title: "שוטטות", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 2001, title: "שמש", character: "בתפקיד עצמו" },
  { role: "actor", heading: "שחקן", year: 1981, title: "הפחדנים", character: "רוני פיינס" },
  { role: "host", heading: "בתפקיד עצמו", year: 2021, title: "ערב טוב עם גיא פינס", character: "מנחה" },
  { role: "host", heading: "בתפקיד עצמו", year: 2018, title: "רגעי הבידור של ישראל", character: "מנחה" },
  { role: "host", heading: "בתפקיד עצמו", year: 2017, title: "ערוץ 2 - השידור האחרון בהחלט" },
  { role: "host", heading: "בתפקיד עצמו", year: 2017, title: "15 שנה לחדשות 10", character: "מגיש" },
  { role: "actor", heading: "בתפקיד עצמו", year: 2016, title: "ארץ נהדרת", character: "בתפקיד עצמו" },
  { role: "actor", heading: "בתפקיד עצמו", year: 2012, title: "מצב האומה", character: "בתפקיד עצמו" },
  { role: "actor", heading: "בתפקיד עצמו", year: 2009, title: "מועדון לילה", character: "בתפקיד עצמו" },
  { role: "host", heading: "בתפקיד עצמו", year: 2008, title: "הכל טוב עם גיא פינס", character: "מנחה" },
  { role: "host", heading: "בתפקיד עצמו", year: 2008, title: "ערב טוב", character: "מגיש ימי ה'" },
  { role: "actor", heading: "בתפקיד עצמו", year: 2006, title: "שניים", character: "בתפקיד עצמו" },
  { role: "host", heading: "בתפקיד עצמו", year: 2006, title: "ציפורי לילה זוגיות", character: "מגיש" },
  { role: "producer", heading: "תפקידים שונים", year: 1998, title: "ארץ קטנה איש גדול", character: "ע. הפקה" },
];

function kindFor(title: string): ProductionKind {
  if (FILMS.has(title)) return "film_cinema";
  return "tv_program";
}

function covers(production: Production, year: number): boolean {
  const end = production.endYear ?? production.year;
  return production.year <= year && year <= end;
}

function newProduction(title: string, year: number): Production {
  return {
    id: `ishim-${slugify(title) || "prod"}`,
    title,
    year,
    kind: kindFor(title),
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

  const created = newProduction(row.title, row.year);
  let id = created.id;
  if (byId.has(id)) id = `${created.id}-${row.year}`;
  if (!byId.has(id)) {
    productions.push({ ...created, id });
    byId.set(id, { ...created, id });
  }
  return id;
}

export function applyIshimGuyPines(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const byId = new Map(productions.map((production) => [production.id, production]));
  const oldIds = new Set(
    data.people
      .filter((person) => person.name === "גיא פינס" || person.id === GUY_PINES_ID)
      .map((person) => person.id)
  );
  oldIds.add(GUY_PINES_ID);

  const credits: Credit[] = assignBillingOrders(
    ROWS.map((row) => ({
      personId: GUY_PINES_ID,
      productionId: resolveProduction(row, productions, byId),
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year,
    }))
  );

  const patch: Partial<Person> = {
    name: "גיא פינס",
    birthDate: "1966-07-25",
    tags: ["אמא מפורסמת", "גלצניקים"],
    activities: ["series", "acting", "hosting"],
    gender: "male",
    ishimClassic: true,
    sourceNote: ISHIM_CLASSIC_SOURCE,
    sourceUrl: SOURCE_URL,
    ishimNotes: [
      {
        heading: "קשר משפחתי",
        items: ["הבן של ציפי פינס", "נשוי לרותי רודנר", "הגיס של חמי רודנר"],
      },
    ],
    updatedAt: NOW,
  };

  let found = false;
  const people = data.people
    .filter((person) => !person.name.startsWith("Please wait"))
    .flatMap((person) => {
      if (person.id !== GUY_PINES_ID && person.name !== "גיא פינס") return [person];
      if (found) return [];
      found = true;
      return [{ ...person, ...patch, id: GUY_PINES_ID }];
    });

  if (!found) {
    people.push({
      id: GUY_PINES_ID,
      name: "גיא פינס",
      nicknames: [],
      tags: ["אמא מפורסמת", "גלצניקים"],
      bio: "",
      activities: ["series", "acting", "hosting"],
      birthDate: "1966-07-25",
      gender: "male",
      ishimClassic: true,
      sourceNote: ISHIM_CLASSIC_SOURCE,
      sourceUrl: SOURCE_URL,
      ishimNotes: patch.ishimNotes,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  return {
    ...data,
    people,
    productions,
    credits: [
      ...data.credits.filter((credit) => !oldIds.has(credit.personId)),
      ...credits,
    ],
  };
}
