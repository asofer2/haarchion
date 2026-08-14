/**
 * Second pass: fill remaining missing dates with cleaned labels + curated fixes.
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";

const UA = "IshimArchive/1.0 (educational; dates pass2)";
type Dates = { birthDate?: string; deathDate?: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanLabel(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/־/g, "-")
    .replace(/[׳']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toIso(v?: string): string | undefined {
  if (!v) return undefined;
  const m = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const y = Number(m[1]);
  if (y < 1000 || y > 2100) return undefined;
  let mm = m[2] === "00" ? "01" : m[2]!;
  let dd = m[3] === "00" ? "01" : m[3]!;
  return `${m[1]}-${mm}-${dd}`;
}

async function qidFromWiki(lang: "he" | "en", title: string): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    title
  )}&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const j = await res.json();
  for (const page of Object.values(j.query?.pages || {}) as any[]) {
    if (page.missing !== undefined) continue;
    if (page.pageprops?.wikibase_item) return page.pageprops.wikibase_item;
  }
  return null;
}

async function searchQid(query: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    query
  )}&language=he&uselang=he&type=item&limit=8&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const j = await res.json();
  for (const h of j.search || []) {
    const desc = `${h.label || ""} ${h.description || ""}`;
    if (/disambiguation|ויקיפדיה:|יישוב|עיר/.test(desc)) continue;
    if (
      /actor|actress|singer|Israeli|ישרא|מדבב|שחקן|שחקנית|זמר|voice|comedian|מנחה|במאי|קומיק/i.test(
        desc
      )
    ) {
      return h.id;
    }
  }
  for (const h of j.search || []) {
    const desc = `${h.label || ""} ${h.description || ""}`;
    if (/disambiguation|ויקיפדיה:/.test(desc)) continue;
    return h.id;
  }
  return null;
}

async function datesFromQid(qid: string): Promise<Dates | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const j = await res.json();
  const claims = j.entities?.[qid]?.claims;
  // Prefer most precise birth (full date over year-only)
  const births = (claims?.P569 || [])
    .map((c: any) => toIso(c?.mainsnak?.datavalue?.value?.time))
    .filter(Boolean) as string[];
  births.sort((a, b) => {
    const score = (d: string) => (d.endsWith("-01-01") ? 0 : 2) + (d.includes("-01-") ? 0 : 1);
    return score(b) - score(a);
  });
  const birthDate = births[0];
  const deathDate = toIso(claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time);
  if (!birthDate && !deathDate) return null;
  return {
    ...(birthDate ? { birthDate } : {}),
    ...(deathDate ? { deathDate } : {}),
  };
}

/** Curated / verified from Wikipedia when automated match failed */
const CURATED: Record<string, Dates> = {
  "yuval-hamevulbal": { birthDate: "1972-07-23" },
  "shira-haas": { birthDate: "1995-05-11" }, // fix year-only SPARQL hit
  "avi-grinik": { birthDate: "1971-11-22" },
  "gvry-alpy": { birthDate: "1976-09-18" },
  "dnh-smv": { birthDate: "1977-09-25" },
};

function formatSeedDates(map: Record<string, Dates>): string {
  const lines = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, d]) => d.birthDate || d.deathDate)
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

  // Apply curated overrides (always for listed keys)
  for (const [id, d] of Object.entries(CURATED)) {
    merged[id] = { ...merged[id], ...d };
  }

  const missing = SEED.people.filter((p) => !(p.birthDate || merged[p.id]?.birthDate));
  console.log(`Still missing: ${missing.length}`);

  let found = 0;
  for (const p of missing) {
    const labels = [
      cleanLabel(p.name),
      p.name,
      p.nameOriginal,
      ...(p.nicknames || []).map(cleanLabel),
    ].filter(Boolean) as string[];

    let dates: Dates | null = null;
    for (const label of [...new Set(labels)]) {
      const lang: "he" | "en" = /[A-Za-z]/.test(label) ? "en" : "he";
      let qid = await qidFromWiki(lang, label);
      await sleep(120);
      if (!qid) {
        qid = await searchQid(label);
        await sleep(150);
      }
      if (!qid) continue;
      dates = await datesFromQid(qid);
      await sleep(120);
      if (dates?.birthDate) break;
    }

    if (dates?.birthDate) {
      found++;
      merged[p.id] = { ...merged[p.id], ...dates };
      console.log(`✓ ${p.name}: ${dates.birthDate}`);
    } else {
      console.log(`✗ ${p.name}`);
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "../src/lib/seed-dates.ts"),
    formatSeedDates(merged),
    "utf8"
  );

  console.log(`Pass2 found: ${found}`);
  console.log(`PERSON_DATES: ${Object.keys(merged).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
