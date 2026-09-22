import rowsJson from "@/data/momi-levy.json";
import { ISHIM_CLASSIC_SOURCE } from "./ishim-import";
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

const NOW = "2026-09-22T00:00:00.000Z";
export const MOMI_LEVY_ID = "mvmy-lvy";

const MOMI_LEVY_WAYBACK_URL =
  "https://web.archive.org/web/20211018144242/https://www.ishim.co.il/p.php?s=%D7%9E%D7%95%D7%9E%D7%99+%D7%9C%D7%95%D7%99";

type IshimRow = {
  role: CreditRole;
  heading: string;
  year?: number;
  title: string;
  character?: string;
};

const ROWS = rowsJson.credits as IshimRow[];

const PREFERRED_PRODUCTION_ID: Record<string, string> = {
  "זהו זה!": "zehu-ze",
};

function kindFor(title: string, role: CreditRole): ProductionKind {
  if (title === 'להקת הנח"ל') return "ensemble";
  if (role === "dubber") return "film_dubbed_foreign";
  if (role === "singer") return "film_dubbed_foreign";
  if (role === "musical_performer") return "ensemble";
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
    genres: [],
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
  id: MOMI_LEVY_ID,
  name: "מומי לוי",
  nameOriginal: "Momi Levi",
  nicknames: rowsJson.birthName ? [rowsJson.birthName] : [],
  birthDate: rowsJson.birthDate,
  bio: "",
  imageUrl: portrait("מומי לוי", "Momi Levi"),
  tags: rowsJson.keys || [],
  activities: [
    "acting",
    "dubbing",
    "series",
    "film",
    "musical",
    "hosting",
  ],
  ishimClassic: true,
  ishimNotes: rowsJson.ishimNotes,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: MOMI_LEVY_WAYBACK_URL,
  wikipediaUrl:
    "https://he.wikipedia.org/wiki/%D7%9E%D7%95%D7%9E%D7%99_%D7%9C%D7%95%D7%99",
  createdAt: NOW,
  updatedAt: NOW,
};

export function applyIshimMomiLevy(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const byId = new Map(productions.map((p) => [p.id, p]));

  const credits: Credit[] = ROWS.map((row) => ({
    personId: MOMI_LEVY_ID,
    productionId: resolveProduction(row.title, row.year, row.role, productions, byId),
    role: row.role,
    characterName: row.character,
    year: row.year,
    heading: row.heading,
  }));

  const mergedCredits = [
    ...data.credits.filter((c) => c.personId !== MOMI_LEVY_ID),
    ...credits,
  ];

  let found = false;
  const people = data.people.map((person) => {
    if (person.id !== MOMI_LEVY_ID && person.name !== "מומי לוי") {
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
