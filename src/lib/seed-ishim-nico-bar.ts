import rowsJson from "@/data/nico-bar.json";
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

const NOW = "2026-09-27T00:00:00.000Z";
/** Existing wiki-dubber id — keep the public URL stable. */
export const NICO_BAR_ID = "nykv-br";

const NICO_BAR_WAYBACK_URL =
  "https://web.archive.org/web/20210422122424/https://www.ishim.co.il/p.php?s=%D7%A0%D7%99%D7%A7%D7%95+%D7%91%D7%A8";

type IshimRow = {
  role: CreditRole;
  heading: string;
  year?: number;
  title: string;
  character?: string;
};

const ROWS = rowsJson.credits as IshimRow[];

function kindFor(role: CreditRole): ProductionKind {
  if (
    role === "dubber" ||
    role === "dub_director" ||
    role === "producer" ||
    role === "singer"
  ) {
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
  const exactTitle = productions.filter((p) => p.title === title);
  const yearMatch = exactTitle.find((p) => year && p.year === year);
  if (yearMatch) return yearMatch.id;
  if (exactTitle.length === 1) return exactTitle[0].id;
  const near = exactTitle.find((p) => isPlausibleMatch(p, year));
  if (near) return near.id;

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
  id: NICO_BAR_ID,
  name: "ניקו בר",
  nicknames: [],
  birthDate: rowsJson.birthDate,
  bio: "",
  imageUrl: portrait("ניקו בר"),
  tags: rowsJson.keys || [],
  activities: ["acting", "dubbing", "series", "film", "hosting", "musical"],
  gender: "male",
  ishimClassic: true,
  ishimNotes: rowsJson.ishimNotes,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: NICO_BAR_WAYBACK_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

export function applyIshimNicoBar(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const byId = new Map(productions.map((p) => [p.id, p]));

  const headingOrder = new Map<string, number>();
  const credits: Credit[] = ROWS.map((row) => {
    const billingOrder = headingOrder.get(row.heading) ?? 0;
    headingOrder.set(row.heading, billingOrder + 1);
    const character = row.character?.trim();
    return {
      personId: NICO_BAR_ID,
      productionId: resolveProduction(
        row.title,
        row.year,
        row.role,
        productions,
        byId
      ),
      role: row.role,
      characterName:
        character && character !== "ניקו בר" ? character : undefined,
      year: row.year,
      heading: row.heading,
      billingOrder,
    };
  });

  const replacedIds = new Set(
    data.people
      .filter((person) => person.id === NICO_BAR_ID || person.name === "ניקו בר")
      .map((person) => person.id)
  );
  replacedIds.add(NICO_BAR_ID);

  const mergedCredits = [
    ...data.credits.filter((c) => !replacedIds.has(c.personId)),
    ...credits,
  ];

  let found = false;
  const people = data.people.map((person) => {
    if (person.id !== NICO_BAR_ID && person.name !== "ניקו בר") {
      return person;
    }
    found = true;
    return {
      ...person,
      ...PERSON_PATCH,
      wikipediaUrl: person.wikipediaUrl,
      imageUrl: person.imageUrl || PERSON_PATCH.imageUrl,
      imageSource: person.imageSource,
      imageCachedAt: person.imageCachedAt,
      deathDate: undefined,
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
