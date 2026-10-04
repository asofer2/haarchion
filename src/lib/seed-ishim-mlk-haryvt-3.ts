import rowsJson from "@/data/mlk-haryvt-3.json";
import { canonicalPersonName } from "./aliases";
import { assignBillingOrders } from "./credit-order";
import { portrait } from "./portrait";
import type { ArchiveData, Credit, CreditRole, Person, Production } from "./types";

const NOW = "2026-10-02T00:00:00.000Z";
/** Stable id when the film is not already in the archive. */
export const LION_KING_3_ID = "ht-mlk-haryvt-3";

const SOURCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%9E%D7%9C%D7%9A-%D7%94%D7%90%D7%A8%D7%99%D7%95%D7%AA-3-%D7%94%D7%90%D7%A7%D7%95%D7%A0%D7%94-%D7%9E%D7%90%D7%98%D7%90%D7%98%D7%94-2004-%D7%90%D7%99%D7%A9%D7%99%D7%9D";

type CreditRow = {
  name: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
  endYear?: number;
};

type PersonRow = { id: string; name: string };

type Note = { heading: string; items: string[] };

function normName(name: string): string {
  return canonicalPersonName(name)
    .trim()
    .replace(/[\u05BE\u2013\u2014\-־]+/g, " ")
    .replace(/['׳״"]/g, "")
    .replace(/\s+/g, " ");
}

function productionRecord(id: string, imageUrl?: string, createdAt?: string): Production {
  return {
    id,
    title: rowsJson.title,
    originalTitle: rowsJson.originalTitle,
    year: rowsJson.year,
    kind: "film_dubbed_foreign",
    summary: rowsJson.summary,
    genres: rowsJson.genres,
    runtimeMinutes: rowsJson.runtimeMinutes,
    ishimKeys: rowsJson.ishimKeys,
    ishimNotes: rowsJson.notes as Note[],
    ishimClassic: true,
    imageUrl: imageUrl || portrait(rowsJson.title, rowsJson.originalTitle),
    sourceNote: "ערוץ הופ תמיר",
    sourceUrl: SOURCE_URL,
    createdAt: createdAt || NOW,
    updatedAt: NOW,
  };
}

function stubPerson(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    nicknames: [],
    bio: `מדבב/ת ישראלי/ת — «${rowsJson.title}», לפי ערוץ הופ תמיר.`,
    tags: ["דיבוב", "הופ תמיר"],
    activities: ["dubbing", "film"],
    sourceNote: "ערוץ הופ תמיר",
    sourceUrl: SOURCE_URL,
    imageUrl: portrait(row.name),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

/** «מלך האריות 3 - האקונה מאטאטה (2004)» מערוץ הופ תמיר — סדר תפקידים כמו במקור. */
export function applyIshimLionKing3(data: ArchiveData): ArchiveData {
  const people = [...data.people];
  const byNorm = new Map(people.map((p) => [normName(p.name), p]));

  for (const row of rowsJson.people as PersonRow[]) {
    if (byNorm.has(normName(row.name))) continue;
    if (people.some((p) => p.id === row.id)) continue;
    const person = stubPerson(row);
    people.push(person);
    byNorm.set(normName(row.name), person);
  }

  const personIdFor = (name: string) => {
    const found = byNorm.get(normName(name));
    if (!found) throw new Error(`Missing person for Lion King 3: ${name}`);
    return found.id;
  };

  const productions = [...data.productions];
  const matchIndexes = productions
    .map((p, i) => (p.id === LION_KING_3_ID || p.title === rowsJson.title ? i : -1))
    .filter((i) => i >= 0);

  const canonicalIndex = matchIndexes.find(
    (i) => productions[i].id === LION_KING_3_ID
  );
  const keepIndex =
    canonicalIndex !== undefined ? canonicalIndex : matchIndexes[0];
  const productionId = LION_KING_3_ID;
  const droppedIds = new Set(
    matchIndexes
      .map((i) => productions[i].id)
      .filter((id) => id !== LION_KING_3_ID)
  );
  if (keepIndex === undefined) {
    productions.push(productionRecord(productionId));
  } else {
    const existing = productions[keepIndex];
    productions[keepIndex] = productionRecord(
      productionId,
      existing.imageUrl,
      existing.createdAt
    );
  }

  const keptProductions = productions.filter((p) => !droppedIds.has(p.id));

  const credits: Credit[] = assignBillingOrders(
    (rowsJson.credits as CreditRow[]).map((row) => ({
      personId: personIdFor(row.name),
      productionId,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year,
      endYear: row.endYear,
    }))
  );

  const replacedIds = new Set([productionId, ...droppedIds]);
  const mergedCredits = [
    ...data.credits.filter((c) => !replacedIds.has(c.productionId)),
    ...credits,
  ];

  return {
    ...data,
    people,
    productions: keptProductions,
    credits: mergedCredits,
  };
}
