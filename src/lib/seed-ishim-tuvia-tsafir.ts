import rowsJson from "@/data/tuvia-tsafir.json";
import { ISHIM_CLASSIC_SOURCE, ishimWaybackPersonUrl } from "./ishim-import";
import { slugify } from "./ids";
import { portrait } from "./portrait";
import type {
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
  ProductionKind,
} from "./types";

const NOW = "2026-09-20T00:00:00.000Z";
export const TUVIA_TSAFIR_ID = "tuvia-tsafir";

type IshimRow = {
  role: CreditRole;
  heading: string;
  year?: number;
  title: string;
  character?: string;
};

const ROWS = rowsJson.credits as IshimRow[];

const PREFERRED_PRODUCTION_ID: Record<string, string> = {
  "רחוב סומסום": "sesame-israel",
  "רחוב סומסום - שארע סימסים": "sesame-israel",
  אלאדין: "aladdin-he",
};

const FILM_TITLES = new Set([
  "גבעת חלפון אינה עונה",
  "הלהקה",
  "נישואין נוסח תל אביב",
  "צ'רלי וחצי",
  "חגיגה בסנוקר",
  "כנרת כנרת",
  "נחצ'ה והגנרל",
  "סלומוניקו",
  "איזה יופי של צרות!",
  "האינסטלטור",
]);

const CASSETTE_TITLES = new Set([
  "סבא דוליטל",
  "אלאדין והנסיכה יסמין",
  "שירים מבית סבא",
  "מותק של פסטיבל - יוצאים לדרך!",
  "חיבוק של שבת",
  "מותק בממלכת הקרח",
  "ממלכת טוביהו",
  "דץ מארח חברים לחגים",
  "מותק של פסטיבל 5",
  "סימבה מלך הספארי",
  "מותק של פסטיגל 4",
  "השירים המשחקים",
  "טובי דובי",
  "מותק של פסטיגל 3",
  "מותק של פסטיגל 2",
  "מותק של פסטיגל",
  "יובל המבולבל - המסע אל הכוכב",
  "סיפורה של מדינה עם סבא טוביה",
  "סיפורי התנ\"ך עם סבא טוביה",
  "סבא טוביה - סיפורים כיד המלך",
  "לא יאומן כי פסטיגל",
  "מסיבה ביער עם סבא טוביה",
  "פים פם פה",
  "פסטיגל 98 - הבחירה של הילדים!",
  "צפיר הנפש",
]);

function kindFor(title: string, role: CreditRole): ProductionKind {
  if (title === 'להקת הנח"ל') return "ensemble";
  if (CASSETTE_TITLES.has(title)) return "cassette_kids";
  if (FILM_TITLES.has(title)) return "film_cinema";
  if (role === "dubber") return "film_dubbed_foreign";
  return "tv_series";
}

function isPlausibleMatch(production: Production, year?: number): boolean {
  if (!year) return true;
  if (production.year === year) return true;
  if (Math.abs(production.year - year) <= 2) return true;
  if (production.id.startsWith("ht-") && production.year > 2000) return false;
  return false;
}

function newProduction(title: string, year: number, role: CreditRole): Production {
  const base = slugify(title) || "ishim-prod";
  return {
    id: `ishim-${base}`,
    title,
    year,
    kind: kindFor(title, role),
    summary: "",
    genres: FILM_TITLES.has(title) ? ["ישראלי"] : [],
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function resolveProduction(
  title: string,
  year: number | undefined,
  role: CreditRole,
  productions: Production[],
  byId: Map<string, Production>
): string {
  const preferred = PREFERRED_PRODUCTION_ID[title];
  if (preferred && byId.has(preferred)) return preferred;

  const exactTitle = productions.filter((p) => p.title === title);
  const match =
    exactTitle.find((p) => year && p.year === year) ||
    exactTitle.find((p) => isPlausibleMatch(p, year));
  if (match) return match.id;

  const created = newProduction(title, year || 0, role);
  let id = created.id;
  if (byId.has(id) && byId.get(id)!.title !== title) {
    id = `${created.id}-${year || "x"}`;
  }
  if (!byId.has(id)) {
    const production = { ...created, id };
    productions.push(production);
    byId.set(id, production);
  }
  return id;
}

const PERSON_PATCH: Person = {
  id: TUVIA_TSAFIR_ID,
  name: "טוביה צפיר",
  nameOriginal: "Tuvia Tzafir",
  nicknames: rowsJson.birthName ? [rowsJson.birthName] : [],
  birthDate: rowsJson.birthDate,
  bio: "",
  imageUrl: portrait("טוביה צפיר", "Tuvia Tzafir"),
  tags: rowsJson.keys || [],
  activities: [
    "acting",
    "dubbing",
    "series",
    "film",
    "stage",
    "cassette",
    "hosting",
    "musical",
  ],
  ishimClassic: true,
  ishimNotes: rowsJson.ishimNotes,
  entryAuthors: ["אליק פומבה", "שלומי כץ", "ברק חננאל"],
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: ishimWaybackPersonUrl("טוביה צפיר"),
  wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%98%D7%95%D7%91%D7%99%D7%94_%D7%A6%D7%A4%D7%99%D7%A8",
  createdAt: NOW,
  updatedAt: NOW,
};

export function applyIshimTuviaTsafir(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const byId = new Map(productions.map((p) => [p.id, p]));

  const credits: Credit[] = ROWS.map((row) => ({
    personId: TUVIA_TSAFIR_ID,
    productionId: resolveProduction(row.title, row.year, row.role, productions, byId),
    role: row.role,
    characterName: row.character,
    year: row.year,
    heading: row.heading,
  }));

  const mergedCredits = [
    ...data.credits.filter((c) => c.personId !== TUVIA_TSAFIR_ID),
    ...credits,
  ];

  let found = false;
  const people = data.people.map((person) => {
    if (person.id !== TUVIA_TSAFIR_ID && person.name !== "טוביה צפיר") {
      return person;
    }
    found = true;
    return {
      ...person,
      ...PERSON_PATCH,
      wikipediaUrl: person.wikipediaUrl || PERSON_PATCH.wikipediaUrl,
      imageUrl: person.imageUrl || PERSON_PATCH.imageUrl,
      createdAt: person.createdAt || NOW,
      updatedAt: NOW,
    };
  });
  if (!found) people.push(PERSON_PATCH);

  return {
    ...data,
    people,
    productions: [...byId.values()],
    credits: mergedCredits,
  };
}
