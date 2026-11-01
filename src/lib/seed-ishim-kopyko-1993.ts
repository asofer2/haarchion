import rowsJson from "@/data/kopyko-1993.json";
import { assignBillingOrders } from "./credit-order";
import { ISHIM_CLASSIC_SOURCE, ishimWaybackPersonUrl } from "./ishim-import";
import { portrait } from "./portrait";
import type { ArchiveData, Credit, CreditRole, Person, Production } from "./types";

const NOW = "2026-11-01T00:00:00.000Z";
/** ערך אישים #1993 — כותרת השנה בדף היא 1994. */
export const KOPYKO_1993_ID = "ishim-kvpykv-1993";
const WAVE2_ID = "kofiko";
const REPLACED_IDS = new Set([KOPYKO_1993_ID, WAVE2_ID]);

const KOPYKO_WAYBACK_URL =
  "https://web.archive.org/web/20211211015552/https://www.ishim.co.il/m.php?s=%D7%A7%D7%95%D7%A4%D7%99%D7%A7%D7%95%231993";

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
  id: KOPYKO_1993_ID,
  title: rowsJson.title,
  year: rowsJson.year,
  endYear: (rowsJson as { endYear?: number }).endYear,
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

function isThisShow(production: Production): boolean {
  if (REPLACED_IDS.has(production.id)) return true;
  if (production.title !== rowsJson.title) return false;
  if (production.year === rowsJson.year) return true;
  // wave2 stub used 1993 for the early series
  return production.year === 1993 && !production.ishimClassic;
}

/** קופיקו (1994 / ערך #1993) — מאתר אישים ב־Wayback. */
export function applyIshimKopyko1993(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  let imageUrl: string | undefined;
  let createdAt: string | undefined;

  for (const production of productions) {
    if (!isThisShow(production)) continue;
    if (production.imageUrl) imageUrl = imageUrl || production.imageUrl;
    if (production.createdAt) createdAt = createdAt || production.createdAt;
  }

  const kept = productions.filter((production) => !isThisShow(production));
  kept.push({
    ...PRODUCTION,
    imageUrl: imageUrl || PRODUCTION.imageUrl,
    createdAt: createdAt || NOW,
    updatedAt: NOW,
  });

  const credits: Credit[] = assignBillingOrders(
    (rowsJson.credits as CreditRow[]).map((row) => ({
      personId: row.personId,
      productionId: KOPYKO_1993_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year ?? rowsJson.year,
      endYear: row.endYear,
    }))
  );

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
    productions: kept,
    credits: [
      ...data.credits.filter((credit) => !REPLACED_IDS.has(credit.productionId)),
      ...credits,
    ],
  };
}
