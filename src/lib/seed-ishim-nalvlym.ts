import rowsJson from "@/data/ishim-nalvlym.json";
import { assignBillingOrders } from "./credit-order";
import { ISHIM_CLASSIC_SOURCE, ishimWaybackPersonUrl } from "./ishim-import";
import { portrait } from "./portrait";
import type { ArchiveData, Credit, CreditRole, Person, Production } from "./types";

const NOW = "2026-09-09T00:00:00.000Z";
export const NALVLYM_ID = "ishim-nalvlym";

const NALVLYM_WAYBACK_URL =
  "https://web.archive.org/web/20211009012026/https://www.ishim.co.il/m.php?s=%D7%A0%D7%A2%D7%9C%D7%95%D7%9C%D7%99%D7%9D";

type CreditRow = {
  personId: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
  endYear?: number;
};

type PersonRow = {
  id: string;
  name: string;
  nameOriginal?: string;
};

const PRODUCTION: Production = {
  id: NALVLYM_ID,
  title: rowsJson.title,
  year: rowsJson.year,
  endYear: rowsJson.endYear,
  kind: "series_dubbed_foreign",
  summary: rowsJson.summary,
  genres: rowsJson.genres,
  channel: rowsJson.channel,
  runtimeMinutes: rowsJson.runtimeMinutes,
  episodeCount: rowsJson.episodeCount,
  ishimClassic: true,
  imageUrl: portrait(rowsJson.title),
  entryAuthors: ["ברק חננאל", "Nir Bassan"],
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: NALVLYM_WAYBACK_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

function stubPerson(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    nameOriginal: row.nameOriginal,
    nicknames: [],
    bio: "",
    tags: ["מדבבים"],
    activities: ["dubbing", "series"],
    ishimClassic: true,
    sourceNote: ISHIM_CLASSIC_SOURCE,
    sourceUrl: ishimWaybackPersonUrl(row.name),
    imageUrl: portrait(row.name, row.nameOriginal),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export function applyIshimNalvlym(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const prodIdx = productions.findIndex(
    (p) =>
      p.id === NALVLYM_ID ||
      (p.title === rowsJson.title && p.year === rowsJson.year)
  );

  if (prodIdx >= 0) {
    const existing = productions[prodIdx];
    productions[prodIdx] = {
      ...existing,
      ...PRODUCTION,
      id: NALVLYM_ID,
      imageUrl: existing.imageUrl || PRODUCTION.imageUrl,
      createdAt: existing.createdAt || NOW,
      updatedAt: NOW,
    };
  } else {
    productions.push(PRODUCTION);
  }

  const credits: Credit[] = assignBillingOrders(
    (rowsJson.credits as CreditRow[]).map((row) => ({
      personId: row.personId,
      productionId: NALVLYM_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year,
      endYear: row.endYear,
    }))
  );

  const mergedCredits = [
    ...data.credits.filter((c) => c.productionId !== NALVLYM_ID),
    ...credits,
  ];

  const people = [...data.people];
  const byId = new Map(people.map((p) => [p.id, p]));

  for (const row of rowsJson.people as PersonRow[]) {
    if (byId.has(row.id)) continue;
    const person = stubPerson(row);
    people.push(person);
    byId.set(row.id, person);
  }

  return {
    ...data,
    people,
    productions,
    credits: mergedCredits,
  };
}
