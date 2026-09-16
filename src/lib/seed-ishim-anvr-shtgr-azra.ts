import rowsJson from "@/data/anvr-shtgr-azra.json";
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

const NOW = "2026-09-11T00:00:00.000Z";
export const ANVR_SHTGR_AZRA_ID = "anvr-shtgr-azra";

type CreditRow = {
  role: CreditRole;
  heading: string;
  year?: number;
  title: string;
  character?: string;
};

const ROWS = rowsJson.credits as CreditRow[];

function cleanIshimNotes(
  notes: { heading: string; items: string[] }[] | undefined
): { heading: string; items: string[] }[] | undefined {
  if (!notes?.length) return undefined;
  const cleaned = notes
    .map((note) => ({
      heading: note.heading,
      items: note.items.filter(
        (item) =>
          item &&
          item !== "--" &&
          !item.includes("אישים בפייסבוק") &&
          !item.includes("היסטוריית עדכונים") &&
          !item.startsWith("תמיר") &&
          !item.startsWith("ברק")
      ),
    }))
    .filter((note) => note.items.length > 0);
  return cleaned.length ? cleaned : undefined;
}

function kindFor(title: string, role: CreditRole): ProductionKind {
  if (role === "dubber") return "series_dubbed_foreign";
  if (role === "producer") return "series_dubbed_foreign";
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
  id: ANVR_SHTGR_AZRA_ID,
  name: rowsJson.name,
  nameOriginal: rowsJson.nameOriginal,
  nicknames: rowsJson.birthName ? [rowsJson.birthName] : [],
  birthDate: rowsJson.birthDate,
  bio: rowsJson.bio,
  imageUrl: portrait(rowsJson.name, rowsJson.nameOriginal, { deep: true }),
  tags: rowsJson.tags,
  activities: ["dubbing", "series", "film"],
  ishimClassic: true,
  ishimNotes: cleanIshimNotes(rowsJson.ishimNotes),
  entryAuthors: rowsJson.entryAuthors,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: ishimWaybackPersonUrl(rowsJson.name),
  createdAt: NOW,
  updatedAt: NOW,
};

export function applyIshimAnvrShtgrAzra(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const byId = new Map(productions.map((p) => [p.id, p]));

  const credits: Credit[] = ROWS.map((row) => ({
    personId: ANVR_SHTGR_AZRA_ID,
    productionId: resolveProduction(row.title, row.year, row.role, productions, byId),
    role: row.role,
    characterName: row.character,
    year: row.year,
    heading: row.heading,
  }));

  const mergedCredits = [
    ...data.credits.filter((c) => c.personId !== ANVR_SHTGR_AZRA_ID),
    ...credits,
  ];

  let found = false;
  const people = data.people.map((person) => {
    if (
      person.id !== ANVR_SHTGR_AZRA_ID &&
      person.name !== rowsJson.name &&
      person.name !== "ענבר שטגר עזרא"
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
