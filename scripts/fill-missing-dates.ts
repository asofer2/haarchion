/**
 * Fill missing birth/death dates from Wikipedia → Wikidata.
 * Only processes people who currently lack birthDate after PERSON_DATES enrichment.
 * Merges into existing seed-dates.ts (does not wipe known dates).
 *
 * Run: npx tsx scripts/fill-missing-dates.ts
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";

const UA = "IshimArchive/1.0 (educational; birth-date fill)";

type Dates = { birthDate?: string; deathDate?: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function toIsoDate(time?: string): string | undefined {
  if (!time) return undefined;
  const m = time.match(/([+-]?\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const y = m[1]!.replace(/^\+/, "");
  const year = Number(y);
  if (year < 1000 || year > 2100) return undefined;
  // Wikidata sometimes uses -00-00 for unknown month/day — keep year-01-01
  let mm = m[2]!;
  let dd = m[3]!;
  if (mm === "00") mm = "01";
  if (dd === "00") dd = "01";
  return `${y.padStart(4, "0")}-${mm}-${dd}`;
}

async function qidFromWikipedia(
  lang: "he" | "en",
  title: string
): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    title
  )}&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&origin=*`;
  const data = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        { pageprops?: { wikibase_item?: string }; missing?: string }
      >;
    };
  }>(url);
  const pages = data?.query?.pages || {};
  for (const page of Object.values(pages)) {
    if (page.missing !== undefined) continue;
    if (page.pageprops?.wikibase_item) return page.pageprops.wikibase_item;
  }
  return null;
}

async function qidFromSearch(query: string, lang: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    query
  )}&language=${lang}&uselang=${lang}&type=item&limit=10&format=json&origin=*`;
  const data = await fetchJson<{
    search?: { id: string; label?: string; description?: string }[];
  }>(url);
  const hits = data?.search || [];
  const isHumanish = (desc: string) =>
    /actor|actress|singer|Israeli|ישרא|מדבב|שחקן|שחקנית|זמר|voice|comedian|presenter|host|musician|director|סופר|במאי|מנחה|קומיק|dubber|puppeteer|בובנ/i.test(
      desc
    );
  const isBad = (desc: string) =>
    /disambiguation|ויקיפדיה:|film|movie|series|album|television series|סדרת|סרט|אלבום|יישוב|עיר|כפר/i.test(
      desc
    );

  for (const h of hits) {
    const desc = `${h.label || ""} ${h.description || ""}`;
    if (isBad(desc)) continue;
    if (isHumanish(desc)) return h.id;
  }
  for (const h of hits) {
    const desc = `${h.label || ""} ${h.description || ""}`;
    if (isBad(desc)) continue;
    return h.id;
  }
  return null;
}

async function datesFromQid(qid: string): Promise<Dates | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims|labels&languages=he|en&format=json&origin=*`;
  const data = await fetchJson<{
    entities?: Record<
      string,
      {
        claims?: {
          P31?: { mainsnak?: { datavalue?: { value?: { id?: string } } } }[];
          P569?: { mainsnak?: { datavalue?: { value?: { time?: string } } } }[];
          P570?: { mainsnak?: { datavalue?: { value?: { time?: string } } } }[];
        };
      }
    >;
  }>(url);
  const entity = data?.entities?.[qid];
  if (!entity) return null;
  const instanceOf = entity.claims?.P31 || [];
  const isHuman = instanceOf.some(
    (c) => c.mainsnak?.datavalue?.value?.id === "Q5"
  );
  // If P31 present and not human, skip (avoid wrong matches)
  if (instanceOf.length && !isHuman) return null;

  const birthDate = toIsoDate(
    entity.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time
  );
  const deathDate = toIsoDate(
    entity.claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time
  );
  if (!birthDate && !deathDate) return null;
  return { ...(birthDate ? { birthDate } : {}), ...(deathDate ? { deathDate } : {}) };
}

async function resolveDates(person: {
  id: string;
  name: string;
  nameOriginal?: string;
  nicknames?: string[];
  wikipediaUrl?: string;
}): Promise<Dates | null> {
  const titles: { lang: "he" | "en"; title: string }[] = [];

  if (person.wikipediaUrl) {
    try {
      const u = new URL(person.wikipediaUrl);
      const lang = u.hostname.startsWith("en.") ? "en" : "he";
      const title = decodeURIComponent(u.pathname.replace(/^\/wiki\//, ""));
      if (title) titles.push({ lang, title });
    } catch {
      /* ignore */
    }
  }

  titles.push({ lang: "he", title: person.name });
  for (const n of person.nicknames || []) {
    if (/[\u0590-\u05FF]/.test(n)) titles.push({ lang: "he", title: n });
    else if (/[a-zA-Z]/.test(n)) titles.push({ lang: "en", title: n });
  }
  if (person.nameOriginal) titles.push({ lang: "en", title: person.nameOriginal });

  const seen = new Set<string>();
  for (const t of titles) {
    const key = `${t.lang}:${t.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const qid = await qidFromWikipedia(t.lang, t.title);
    await sleep(120);
    if (!qid) continue;
    const dates = await datesFromQid(qid);
    await sleep(120);
    if (dates?.birthDate) return dates;
  }

  // Search fallback
  const queries = [person.name, person.nameOriginal, ...(person.nicknames || [])].filter(
    Boolean
  ) as string[];
  for (const q of queries) {
    const lang = /[a-zA-Z]/.test(q) ? "en" : "he";
    const qid = await qidFromSearch(q, lang);
    await sleep(150);
    if (!qid) continue;
    const dates = await datesFromQid(qid);
    await sleep(120);
    if (dates?.birthDate) return dates;
  }

  return null;
}

function formatSeedDates(map: Record<string, Dates>): string {
  const lines = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, d]) => {
      const parts = [
        d.birthDate ? `birthDate: "${d.birthDate}"` : null,
        d.deathDate ? `deathDate: "${d.deathDate}"` : null,
      ].filter(Boolean);
      return `  "${id}": { ${parts.join(", ")} },`;
    })
    .join("\n");
  return `/** Birth/death dates from Wikidata/Wikipedia (+ curated fills) */
export const PERSON_DATES: Record<
  string,
  { birthDate?: string; deathDate?: string }
> = {
${lines}
};
`;
}

async function main() {
  const merged: Record<string, Dates> = { ...PERSON_DATES };

  const missing = SEED.people.filter((p) => {
    const known = merged[p.id];
    return !(p.birthDate || known?.birthDate);
  });

  console.log(`Missing birthDate: ${missing.length} / ${SEED.people.length}`);

  let found = 0;
  let i = 0;
  const report: { id: string; name: string; birthDate?: string; deathDate?: string }[] =
    [];

  // Process in chunks with progress file for resume
  const progressPath = path.join(__dirname, "fill-dates-progress.json");
  let progress: Record<string, Dates> = {};
  if (fs.existsSync(progressPath)) {
    progress = JSON.parse(fs.readFileSync(progressPath, "utf8"));
    console.log(`Resuming with ${Object.keys(progress).length} progress hits`);
  }

  for (const person of missing) {
    i++;
    if (progress[person.id]?.birthDate) {
      merged[person.id] = {
        birthDate: progress[person.id].birthDate,
        deathDate: progress[person.id].deathDate || merged[person.id]?.deathDate,
      };
      found++;
      console.log(
        `[${i}/${missing.length}] (cache) ${person.name}: ${progress[person.id].birthDate}`
      );
      continue;
    }

    const dates = await resolveDates(person);
    if (dates?.birthDate) {
      found++;
      merged[person.id] = {
        birthDate: dates.birthDate,
        deathDate: dates.deathDate || merged[person.id]?.deathDate,
      };
      progress[person.id] = dates;
      report.push({ id: person.id, name: person.name, ...dates });
      console.log(
        `[${i}/${missing.length}] ✓ ${person.name}: ${dates.birthDate}${dates.deathDate ? " / " + dates.deathDate : ""}`
      );
    } else {
      console.log(`[${i}/${missing.length}] ✗ ${person.name}`);
    }

    if (i % 25 === 0) {
      fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), "utf8");
    }
  }

  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), "utf8");

  // Keep only entries that have at least one date
  const cleaned: Record<string, Dates> = {};
  for (const [id, d] of Object.entries(merged)) {
    if (d.birthDate || d.deathDate) cleaned[id] = d;
  }

  fs.writeFileSync(
    path.join(__dirname, "wikidata-dates.json"),
    JSON.stringify(cleaned, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(__dirname, "../src/lib/seed-dates.ts"),
    formatSeedDates(cleaned),
    "utf8"
  );
  fs.writeFileSync(
    path.join(__dirname, "fill-dates-report.json"),
    JSON.stringify({ found, missing: missing.length, newlyAdded: report }, null, 2),
    "utf8"
  );

  console.log(`\nDone. Newly found: ${found}/${missing.length}`);
  console.log(`PERSON_DATES size: ${Object.keys(cleaned).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
