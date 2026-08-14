import { slugify } from "./ids";
import { portrait } from "./portrait";
import type { ArchiveData, Credit, Production } from "./types";

const now = "2026-07-24T18:00:00.000Z";

/**
 * Turn Wikipedia/Wikidata discography rows into archive productions + singer credits.
 */
export function ensureDiscographyProductions(data: ArchiveData): ArchiveData {
  const people = data.people.map((p) => ({
    ...p,
    activities: [...(p.activities || [])],
    discography: p.discography ? [...p.discography] : p.discography,
  }));
  const productions = [...data.productions];
  const credits = [...data.credits];
  const prodIds = new Set(productions.map((p) => p.id));
  const creditKey = (c: Credit) =>
    `${c.productionId}_${c.personId}_${c.role}`;
  const creditKeys = new Set(credits.map(creditKey));

  for (const person of people) {
    const items = person.discography || [];
    if (!items.length) continue;

    if (
      !person.activities.includes("cassette") &&
      !person.activities.includes("performance")
    ) {
      person.activities.push("performance");
    }

    for (const item of items) {
      const id = `disc-${person.id}-${slugify(item.title)}${
        item.year ? `-${item.year}` : ""
      }`.slice(0, 80);
      if (!prodIds.has(id)) {
        const kind = item.kind === "קלטת" ? "cassette" : "performance";
        const also =
          person.nameOriginal || person.name;
        const production: Production = {
          id,
          title: item.title,
          year: item.year && item.year > 1900 ? item.year : 1990,
          kind,
          summary: `ערך מדיסקוגרפיה של ${person.name} (ויקיפדיה / ויקידאטה).`,
          genres: ["דיסקוגרפיה", item.kind || "אלבום"].filter(Boolean),
          // Album cover via multi-source portrait (Cover Art Archive / Commons / Openverse)
          imageUrl: portrait(item.title, also, { kind: "album" }),
          createdAt: now,
          updatedAt: now,
        };
        productions.push(production);
        prodIds.add(id);
      } else {
        // Backfill image on existing discography rows that still lack one
        const idx = productions.findIndex((p) => p.id === id);
        if (idx >= 0 && !productions[idx]!.imageUrl) {
          const also = person.nameOriginal || person.name;
          productions[idx] = {
            ...productions[idx]!,
            imageUrl: portrait(item.title, also, { kind: "album" }),
          };
        }
      }

      const credit: Credit = {
        personId: person.id,
        productionId: id,
        role: "singer",
        characterName: item.kind || "דיסקוגרפיה",
      };
      if (!creditKeys.has(creditKey(credit))) {
        credits.push(credit);
        creditKeys.add(creditKey(credit));
      }
    }
  }

  return { ...data, people, productions, credits };
}
