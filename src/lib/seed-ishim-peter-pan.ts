import rowsJson from "@/data/peter-pan-ishim.json";
import { assignBillingOrders } from "./credit-order";
import {
  ISHIM_CLASSIC_SOURCE,
  ishimWaybackPersonUrl,
  ishimWaybackProductionUrl,
} from "./ishim-import";
import { portrait } from "./portrait";
import type { ArchiveData, Credit, CreditRole, Person, Production } from "./types";

const NOW = "2026-09-11T00:00:00.000Z";
export const PETER_PAN_ID = "ht-peter-pan-adventures";

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
  id: PETER_PAN_ID,
  title: rowsJson.title,
  originalTitle: rowsJson.originalTitle,
  year: rowsJson.year,
  endYear: rowsJson.endYear,
  kind: "series_dubbed_foreign",
  summary: rowsJson.summary,
  genres: rowsJson.genres,
  channel: rowsJson.channel,
  runtimeMinutes: rowsJson.runtimeMinutes,
  episodeCount: rowsJson.episodeCount,
  ishimKeys: rowsJson.ishimKeys,
  ishimClassic: true,
  imageUrl: portrait(rowsJson.title, rowsJson.originalTitle),
  entryAuthors: rowsJson.entryAuthors,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: ishimWaybackProductionUrl(rowsJson.title),
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

export function applyIshimPeterPan(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const prodIdx = productions.findIndex(
    (p) =>
      p.id === PETER_PAN_ID ||
      (p.title === rowsJson.title && p.year === rowsJson.year)
  );

  if (prodIdx >= 0) {
    const existing = productions[prodIdx];
    productions[prodIdx] = {
      ...existing,
      ...PRODUCTION,
      id: PETER_PAN_ID,
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
      productionId: PETER_PAN_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: rowsJson.year,
    }))
  );

  const mergedCredits = [
    ...data.credits.filter((c) => c.productionId !== PETER_PAN_ID),
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
