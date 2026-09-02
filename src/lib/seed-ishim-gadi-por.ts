import rowsJson from "@/data/gadi-por.json";
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

const NOW = "2026-08-31T00:00:00.000Z";
export const GADI_POR_ID = "gdy-pvr";

type GadiRow = {
  role: CreditRole;
  heading: string;
  year?: number;
  title: string;
  character?: string;
};

const ROWS = rowsJson.credits as GadiRow[];

const PREFERRED_PRODUCTION_ID: Record<string, string> = {
  "זהו זה!": "zehu-ze",
  "הופה היי": "hopa-hey",
};

const FILM_TITLES = new Set([
  "זולגות הדמעות מעצמן",
  "הגמל המעופף",
  "ברלין ירושלים",
]);

function kindFor(title: string, role: CreditRole): ProductionKind {
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
    genres: FILM_TITLES.has(title) ? ["ישראלי"] : ["טלוויזיה"],
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
  id: GADI_POR_ID,
  name: "גדי פור",
  nameOriginal: "Gadi Por",
  nicknames: [],
  birthDate: rowsJson.birthDate,
  bio: "",
  imageUrl: portrait("גדי פור", "Gadi Por"),
  tags: [],
  activities: ["acting", "dubbing", "series", "film"],
  ishimClassic: true,
  ishimNotes: rowsJson.ishimNotes,
  entryAuthors: ["ברק חננאל"],
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: ishimWaybackPersonUrl("גדי פור"),
  createdAt: NOW,
  updatedAt: NOW,
};

export function applyIshimGadiPor(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const byId = new Map(productions.map((p) => [p.id, p]));

  const credits: Credit[] = ROWS.map((row) => ({
    personId: GADI_POR_ID,
    productionId: resolveProduction(row.title, row.year, row.role, productions, byId),
    role: row.role,
    characterName: row.character,
    year: row.year,
    heading: row.heading,
  }));

  const mergedCredits = [
    ...data.credits.filter((c) => c.personId !== GADI_POR_ID),
    ...credits,
  ];

  let found = false;
  const people = data.people.map((person) => {
    if (person.id !== GADI_POR_ID && person.name !== "גדי פור") return person;
    found = true;
    return {
      ...person,
      ...PERSON_PATCH,
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
