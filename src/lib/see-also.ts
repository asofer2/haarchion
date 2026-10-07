import { SEED } from "./seed";
import type { Production } from "./types";

function normTitle(value: string): string {
  return value
    .trim()
    .replace(/[\u05BE\u2013\u2014\-־]+/g, " ")
    .replace(/['׳״"]/g, "")
    .replace(/\s+/g, " ");
}

/** «ראה גם …» / «ראה סדרת המשך …» when the rest is a catalog title. */
export function seeAlsoHref(
  item: string,
  productions: Production[] | undefined,
  currentId?: string
): string | undefined {
  const match = item.trim().match(/^(?:ראה גם|ראה סדרת המשך)\s+(.+)$/);
  if (!match) return undefined;

  let title = match[1].trim();
  let year: number | undefined;
  const yearMatch = title.match(/^(.*?)\s*\((\d{4})(?:\s*[–\-־]\s*\d{4})?\)\s*$/);
  if (yearMatch) {
    title = yearMatch[1].trim();
    year = Number(yearMatch[2]);
  }
  const key = normTitle(title);
  if (!key) return undefined;

  const pool = [...(productions || []), ...SEED.productions].filter(
    (production) =>
      production.id !== currentId && normTitle(production.title) === key
  );
  const byId = new Map<string, Production>();
  for (const production of pool) {
    if (!byId.has(production.id)) byId.set(production.id, production);
  }
  const hits = [...byId.values()];
  if (!hits.length) return undefined;

  const hit = year
    ? hits.find(
        (production) =>
          production.year === year ||
          (production.endYear != null &&
            year >= production.year &&
            year <= production.endYear)
      )
    : hits.find((production) => !production.id.startsWith("ishim-") && !production.id.startsWith("approved-")) ||
      hits[0];
  if (!hit) return undefined;
  return `/productions/${encodeURIComponent(hit.id)}`;
}
