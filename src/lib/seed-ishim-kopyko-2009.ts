import rowsJson from "@/data/kopyko-2009.json";
import { assignBillingOrders } from "./credit-order";
import { ISHIM_CLASSIC_SOURCE, ishimWaybackPersonUrl } from "./ishim-import";
import { portrait } from "./portrait";
import type { ArchiveData, Credit, CreditRole, Person, Production } from "./types";

const NOW = "2026-09-13T00:00:00.000Z";
export const KOPYKO_2009_ID = "ishim-kvpykv-2009";

const KOPYKO_WAYBACK_URL =
  "https://web.archive.org/web/20190915201811/https://www.ishim.co.il/m.php?s=%D7%A7%D7%95%D7%A4%D7%99%D7%A7%D7%95%232009";

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
  id: KOPYKO_2009_ID,
  title: rowsJson.title,
  year: rowsJson.year,
  endYear: rowsJson.endYear,
  kind: rowsJson.kind as Production["kind"],
  summary: rowsJson.summary,
  genres: rowsJson.genres,
  channel: rowsJson.channel,
  runtimeMinutes: rowsJson.runtimeMinutes,
  episodeCount: rowsJson.episodeCount,
  ishimKeys: rowsJson.ishimKeys,
  ishimNotes: rowsJson.ishimNotes,
  ishimClassic: true,
  imageUrl: portrait(rowsJson.title),
  entryAuthors: rowsJson.entryAuthors,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: KOPYKO_WAYBACK_URL,
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
    tags: [],
    activities: ["series", "acting"],
    ishimClassic: true,
    sourceNote: ISHIM_CLASSIC_SOURCE,
    sourceUrl: ishimWaybackPersonUrl(row.name),
    imageUrl: portrait(row.name, row.nameOriginal),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export function applyIshimKopyko2009(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const prodIdx = productions.findIndex(
    (p) =>
      p.id === KOPYKO_2009_ID ||
      (p.title === rowsJson.title && p.year === rowsJson.year && p.ishimClassic)
  );

  if (prodIdx >= 0) {
    const existing = productions[prodIdx];
    productions[prodIdx] = {
      ...existing,
      ...PRODUCTION,
      id: KOPYKO_2009_ID,
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
      productionId: KOPYKO_2009_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year ?? rowsJson.year,
      endYear: row.endYear,
    }))
  );

  const mergedCredits = [
    ...data.credits.filter((c) => c.productionId !== KOPYKO_2009_ID),
    ...credits,
  ];

  const people = [...data.people];
  const byId = new Map(people.map((p) => [p.id, p]));

  for (const row of (rowsJson.people || []) as PersonRow[]) {
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
