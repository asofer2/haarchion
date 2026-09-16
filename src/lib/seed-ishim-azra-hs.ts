import rowsJson from "@/data/azra-hs.json";
import { ISHIM_CLASSIC_SOURCE, ishimWaybackPersonUrl } from "./ishim-import";
import { slugify } from "./ids";
import { portrait } from "./portrait";
import { HYH_HYH_HADM_ID } from "./seed-ishim-hyh-hyh-hadm";
import type {
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
  ProductionKind,
} from "./types";

const NOW = "2026-09-09T00:00:00.000Z";
export const AZRA_HS_ID = "azra-hs";

const AZRA_HS_WAYBACK_URL =
  "https://web.archive.org/web/20220113093341/https://www.ishim.co.il/p.php?s=%D7%A2%D7%96%D7%A8%D7%90+%D7%94%D7%A1";

type CreditRow = {
  role: CreditRole;
  heading: string;
  year?: number;
  title: string;
  character?: string;
};

const PREFERRED_PRODUCTION_ID: Record<string, string> = {
  "היה היה - האדם": HYH_HYH_HADM_ID,
  פינוקיו: "pinocchio-he",
};

function kindFor(title: string, role: CreditRole): ProductionKind {
  if (title === "פול טמפל") return "radio_program";
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
  id: AZRA_HS_ID,
  name: rowsJson.name,
  nicknames: [],
  birthDate: rowsJson.birthDate,
  deathDate: rowsJson.deathDate,
  bio: "",
  imageUrl: portrait(rowsJson.name),
  tags: [],
  activities: ["acting", "dubbing", "series", "film", "radio", "hosting"],
  ishimClassic: true,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: AZRA_HS_WAYBACK_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

export function applyIshimAzraHs(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const byId = new Map(productions.map((p) => [p.id, p]));

  const credits: Credit[] = (rowsJson.credits as CreditRow[]).map((row) => ({
    personId: AZRA_HS_ID,
    productionId: resolveProduction(row.title, row.year, row.role, productions, byId),
    role: row.role,
    characterName: row.character,
    year: row.year,
    heading: row.heading,
  }));

  const mergedCredits = [
    ...data.credits.filter((c) => c.personId !== AZRA_HS_ID),
    ...credits,
  ];

  let found = false;
  const people = data.people.map((person) => {
    if (person.id !== AZRA_HS_ID && person.name !== rowsJson.name) return person;
    found = true;
    return {
      ...person,
      ...PERSON_PATCH,
      imageUrl: person.imageUrl || PERSON_PATCH.imageUrl,
      wikipediaUrl: person.wikipediaUrl || undefined,
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
