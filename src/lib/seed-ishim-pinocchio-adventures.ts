import rowsJson from "@/data/pinocchio-adventures-1993.json";
import { assignBillingOrders } from "./credit-order";
import { ISHIM_CLASSIC_SOURCE, ishimWaybackPersonUrl } from "./ishim-import";
import { portrait } from "./portrait";
import type { ArchiveData, Credit, CreditRole, Person, Production } from "./types";

const NOW = "2026-09-14T00:00:00.000Z";
export const PINOCCHIO_ADVENTURES_1993_ID = "ishim-hrptkavtyv-shl-pynvkyv";

const WAYBACK_URL =
  "https://web.archive.org/web/20230521192310/https://www.ishim.co.il/m.php?s=%D7%94%D7%A8%D7%A4%D7%AA%D7%A7%D7%90%D7%95%D7%AA%D7%99%D7%95+%D7%A9%D7%9C+%D7%A4%D7%99%D7%A0%D7%95%D7%A7%D7%99%D7%95";

type CreditRow = {
  personId: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

type PersonRow = {
  id: string;
  name: string;
  nameOriginal?: string;
};

const PRODUCTION: Production = {
  id: PINOCCHIO_ADVENTURES_1993_ID,
  title: rowsJson.title,
  originalTitle: rowsJson.originalTitle,
  year: rowsJson.year,
  kind: rowsJson.kind as Production["kind"],
  summary: rowsJson.summary,
  genres: rowsJson.genres,
  channel: rowsJson.channel,
  runtimeMinutes: rowsJson.runtimeMinutes,
  ishimKeys: rowsJson.ishimKeys,
  ishimNotes: rowsJson.ishimNotes,
  ishimClassic: true,
  imageUrl: portrait(rowsJson.title, rowsJson.originalTitle),
  entryAuthors: rowsJson.entryAuthors,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: WAYBACK_URL,
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
    activities: ["dubbing", "film"],
    ishimClassic: true,
    sourceNote: ISHIM_CLASSIC_SOURCE,
    sourceUrl: ishimWaybackPersonUrl(row.name),
    imageUrl: portrait(row.name, row.nameOriginal),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export function applyIshimPinocchioAdventures1993(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const prodIdx = productions.findIndex(
    (p) =>
      p.id === PINOCCHIO_ADVENTURES_1993_ID ||
      (p.title === rowsJson.title && p.year === rowsJson.year)
  );

  if (prodIdx >= 0) {
    const existing = productions[prodIdx];
    productions[prodIdx] = {
      ...existing,
      ...PRODUCTION,
      id: PINOCCHIO_ADVENTURES_1993_ID,
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
      productionId: PINOCCHIO_ADVENTURES_1993_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: rowsJson.year,
    }))
  );

  const mergedCredits = [
    ...data.credits.filter((c) => c.productionId !== PINOCCHIO_ADVENTURES_1993_ID),
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
