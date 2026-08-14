/**
 * Pass 3: for people with wikipediaUrl (or short bio), pull intro extract.
 * Run: npx tsx scripts/enrich-pass3-bios.ts
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";
import { PERSON_WIKI_ENRICHMENT } from "../src/lib/seed-wiki-enrichment";
import { applyPeopleEnrichment } from "../src/lib/person-dates";

const UA = "IshimArchive/1.0 (educational; bio pass3)";
const OUT_DATES = path.join(__dirname, "../src/lib/seed-dates.ts");
const OUT_BIOS = path.join(__dirname, "../src/lib/seed-wiki-enrichment.ts");
const PROGRESS = path.join(__dirname, "enrich-pass3-progress.json");

type Dates = { birthDate?: string; deathDate?: string };
type Enrich = { bio?: string; wikipediaUrl?: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toIso(v?: string): string | undefined {
  if (!v) return undefined;
  const m = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const y = Number(m[1]);
  if (y < 1920 || y > 2100) return undefined;
  const mm = m[2] === "00" ? "01" : m[2]!;
  const dd = m[3] === "00" ? "01" : m[3]!;
  return `${m[1]}-${mm}-${dd}`;
}

function titleFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const raw = u.pathname.split("/wiki/")[1];
    if (!raw) return null;
    return decodeURIComponent(raw.replace(/_/g, " "));
  } catch {
    return null;
  }
}

function trimBio(extract: string, max = 420): string {
  let t = extract.replace(/\s+/g, " ").trim();
  if (/האם התכוונתם|עמוד פירושונים/i.test(t)) return "";
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"));
  return (last > 120 ? cut.slice(0, last + 1) : cut.trim() + "…").trim();
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    const text = await res.text();
    if (text.startsWith("You are")) return null;
    if (!res.ok) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function wikiLookup(title: string) {
  const url =
    `https://he.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}` +
    `&prop=pageprops|extracts&ppprop=wikibase_item&exintro=1&explaintext=1&redirects=1&format=json&origin=*`;
  const data = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          missing?: string;
          title?: string;
          extract?: string;
          pageprops?: { wikibase_item?: string };
        }
      >;
    };
  }>(url);
  if (!data?.query?.pages) return null;
  for (const page of Object.values(data.query.pages)) {
    if (page.missing !== undefined) continue;
    return {
      title: page.title || title,
      qid: page.pageprops?.wikibase_item,
      extract: page.extract?.trim(),
    };
  }
  return null;
}

async function datesFromQid(qid: string): Promise<Dates> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json&origin=*`;
  const data = await fetchJson<{ entities?: Record<string, { claims?: any }> }>(url);
  const claims = data?.entities?.[qid]?.claims;
  if (!claims) return {};
  const births = (claims.P569 || [])
    .map((c: any) => toIso(c?.mainsnak?.datavalue?.value?.time))
    .filter(Boolean) as string[];
  births.sort((a, b) => ((b.endsWith("-01-01") ? 0 : 2) - (a.endsWith("-01-01") ? 0 : 2)));
  const deathDate = toIso(claims.P570?.[0]?.mainsnak?.datavalue?.value?.time);
  return {
    ...(births[0] ? { birthDate: births[0] } : {}),
    ...(deathDate ? { deathDate } : {}),
  };
}

function formatDates(map: Record<string, Dates>): string {
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

function formatBios(map: Record<string, Enrich>): string {
  const lines = Object.entries(map)
    .filter(([, e]) => e.bio || e.wikipediaUrl)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, e]) => {
      const parts = [
        e.bio ? `bio: ${JSON.stringify(e.bio)}` : null,
        e.wikipediaUrl ? `wikipediaUrl: ${JSON.stringify(e.wikipediaUrl)}` : null,
      ].filter(Boolean);
      return `  "${id}": { ${parts.join(", ")} },`;
    })
    .join("\n");
  return `/** Wikipedia extracts for people (bios + links) — scripts/enrich-all-wiki.ts */
export const PERSON_WIKI_ENRICHMENT: Record<
  string,
  { bio?: string; wikipediaUrl?: string }
> = {
${lines}
};
`;
}

function needsBetterBio(bio?: string): boolean {
  if (!bio) return true;
  if (bio.length < 140) return true;
  return /ארכיון ערוץ הופ|לפי קטגוריית מדבבים|מדבב\/ת ועורך/.test(bio);
}

async function main() {
  const dates: Record<string, Dates> = { ...PERSON_DATES };
  const enrich: Record<string, Enrich> = { ...PERSON_WIKI_ENRICHMENT };
  const people = applyPeopleEnrichment(SEED.people);

  let done: Record<string, boolean> = {};
  if (fs.existsSync(PROGRESS)) done = JSON.parse(fs.readFileSync(PROGRESS, "utf8"));

  const targets = people.filter((p) => {
    if (done[p.id] && enrich[p.id]?.bio && enrich[p.id]!.bio!.length >= 140) return false;
    const enrichedBio = enrich[p.id]?.bio || p.bio;
    if (!needsBetterBio(enrichedBio)) return false;
    // Prefer those with a wiki URL we can resolve immediately
    return !!(p.wikipediaUrl || enrich[p.id]?.wikipediaUrl || needsBetterBio(p.bio));
  });

  // Prioritize people who already have wikipediaUrl
  targets.sort((a, b) => {
    const aw = a.wikipediaUrl || enrich[a.id]?.wikipediaUrl ? 0 : 1;
    const bw = b.wikipediaUrl || enrich[b.id]?.wikipediaUrl ? 0 : 1;
    return aw - bw;
  });

  console.log("Pass3 targets:", targets.length);
  let hits = 0;
  let i = 0;

  for (const person of targets) {
    i++;
    const existingEnrich = enrich[person.id]?.bio;
    if (existingEnrich && existingEnrich.length >= 140 && !needsBetterBio(existingEnrich)) {
      done[person.id] = true;
      continue;
    }

    const url = person.wikipediaUrl || enrich[person.id]?.wikipediaUrl;
    const title = titleFromUrl(url) || person.name.replace(/\s*\([^)]*\)\s*/g, " ").trim();
    const page = await wikiLookup(title);
    await sleep(160);
    if (!page?.extract) {
      if (i % 40 === 0) console.log(`[${i}/${targets.length}] …`);
      done[person.id] = true;
      if (i % 20 === 0) fs.writeFileSync(PROGRESS, JSON.stringify(done), "utf8");
      continue;
    }

    const bio = trimBio(page.extract);
    if (!bio || bio.length < 50) {
      done[person.id] = true;
      continue;
    }

    let d: Dates = {};
    if (page.qid && !dates[person.id]?.birthDate && !person.birthDate) {
      d = await datesFromQid(page.qid);
      await sleep(100);
    }

    enrich[person.id] = {
      ...enrich[person.id],
      bio,
      wikipediaUrl:
        enrich[person.id]?.wikipediaUrl ||
        person.wikipediaUrl ||
        `https://he.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
    };
    if (d.birthDate || d.deathDate) {
      dates[person.id] = {
        birthDate: d.birthDate || dates[person.id]?.birthDate,
        deathDate: d.deathDate || dates[person.id]?.deathDate,
      };
    }

    hits++;
    if (hits <= 40 || hits % 25 === 0) {
      console.log(`[${i}/${targets.length}] ✓ ${person.name} bio=${bio.length}`);
    }

    done[person.id] = true;
    if (i % 20 === 0) {
      fs.writeFileSync(PROGRESS, JSON.stringify(done), "utf8");
      fs.writeFileSync(OUT_DATES, formatDates(dates), "utf8");
      fs.writeFileSync(OUT_BIOS, formatBios(enrich), "utf8");
    }
  }

  fs.writeFileSync(PROGRESS, JSON.stringify(done), "utf8");
  fs.writeFileSync(OUT_DATES, formatDates(dates), "utf8");
  fs.writeFileSync(OUT_BIOS, formatBios(enrich), "utf8");
  console.log(`\nDone. hits=${hits} wikiBios=${Object.values(enrich).filter((e) => e.bio).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
