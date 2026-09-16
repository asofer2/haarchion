import rowsJson from "@/data/yaakov-shem-tov.json";
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

const NOW = "2026-09-14T00:00:00.000Z";
export const YAAKOV_SHEM_TOV_ID = "yqkv-shm-tvb";

const WAYBACK_URL =
  "https://web.archive.org/web/20230514013544/https://www.ishim.co.il/p.php?s=%D7%99%D7%A2%D7%A7%D7%91+%D7%A9%D7%9D+%D7%98%D7%95%D7%91";

type CreditRow = {
  role: CreditRole;
  heading: string;
  year?: number;
  title: string;
  character?: string;
};

const ROWS = rowsJson.credits as CreditRow[];

const PREFERRED_PRODUCTION_ID: Record<string, string> = {
  "נולד לטוס": "ishim-nvld-ltvs",
  פינוקי: "pinocchio-he",
};

function kindFor(role: CreditRole): ProductionKind {
  if (role === "dubber" || role === "dub_director" || role === "producer") {
    return "series_dubbed_foreign";
  }
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
    kind: kindFor(role),
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
  id: YAAKOV_SHEM_TOV_ID,
  name: rowsJson.name,
  nameOriginal: (rowsJson as { nameOriginal?: string }).nameOriginal,
  nicknames: (rowsJson as { nicknames?: string[] }).nicknames || [],
  bio: rowsJson.bio || "",
  imageUrl: portrait(
    rowsJson.name,
    (rowsJson as { nameOriginal?: string }).nameOriginal,
    { deep: true }
  ),
  tags: rowsJson.tags || [],
  activities: ["dubbing", "film", "series"],
  ishimClassic: true,
  ishimNotes: rowsJson.ishimNotes,
  entryAuthors: rowsJson.entryAuthors?.length ? rowsJson.entryAuthors : undefined,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: WAYBACK_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

export function applyIshimYaakovShemTov(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const byId = new Map(productions.map((p) => [p.id, p]));

  const credits: Credit[] = ROWS.map((row) => ({
    personId: YAAKOV_SHEM_TOV_ID,
    productionId: resolveProduction(row.title, row.year, row.role, productions, byId),
    role: row.role,
    characterName: row.character,
    year: row.year,
    heading: row.heading,
  }));

  const mergedCredits = [
    ...data.credits.filter((c) => c.personId !== YAAKOV_SHEM_TOV_ID),
    ...credits,
  ];

  let found = false;
  const people = data.people.map((person) => {
    if (
      person.id !== YAAKOV_SHEM_TOV_ID &&
      person.name !== rowsJson.name &&
      person.name !== "יעקב שם-טוב"
    ) {
      return person;
    }
    found = true;
    return {
      ...person,
      ...PERSON_PATCH,
      imageUrl: person.imageUrl?.includes("/images/")
        ? person.imageUrl
        : PERSON_PATCH.imageUrl || person.imageUrl,
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
