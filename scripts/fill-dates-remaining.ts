/**
 * Fill remaining missing birth/death dates + curated notables.
 * Also adds death dates when Wikidata has P570.
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";

const UA = "IshimArchive/1.0 (educational; dates fill remaining)";
type Dates = { birthDate?: string; deathDate?: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toIso(v?: string): string | undefined {
  if (!v) return undefined;
  const m = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const y = Number(m[1]);
  if (y < 1920 || y > 2100) return undefined; // skip wrong historical matches
  let mm = m[2] === "00" ? "01" : m[2]!;
  let dd = m[3] === "00" ? "01" : m[3]!;
  return `${m[1]}-${mm}-${dd}`;
}

function cleanLabel(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

async function sparqlBatch(labels: string[]): Promise<Map<string, Dates>> {
  const out = new Map<string, Dates>();
  if (!labels.length) return out;
  const values = labels
    .map((l) => `"${l.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"@he`)
    .join(" ");
  const query = `SELECT ?label ?birth ?death WHERE {
    VALUES ?label { ${values} }
    ?item rdfs:label ?label .
    ?item wdt:P31 wd:Q5 .
    OPTIONAL { ?item wdt:P569 ?birth . }
    OPTIONAL { ?item wdt:P570 ?death . }
  }`;
  const url =
    "https://query.wikidata.org/sparql?format=json&query=" +
    encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": UA,
    },
  });
  if (!res.ok) {
    console.log("SPARQL", res.status);
    return out;
  }
  const j = await res.json();
  for (const b of j.results?.bindings || []) {
    const label = b.label?.value as string;
    const birthDate = toIso(b.birth?.value);
    const deathDate = toIso(b.death?.value);
    if (!label || !birthDate) continue;
    const prev = out.get(label);
    const prefer =
      !prev?.birthDate ||
      (prev.birthDate.endsWith("-01-01") && !birthDate.endsWith("-01-01"));
    if (prefer) {
      out.set(label, {
        birthDate,
        ...(deathDate ? { deathDate } : prev?.deathDate ? { deathDate: prev.deathDate } : {}),
      });
    }
  }
  return out;
}

async function qidFromWiki(title: string): Promise<string | null> {
  const url = `https://he.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    title
  )}&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&origin=*`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const j = await res.json();
    for (const page of Object.values(j.query?.pages || {}) as any[]) {
      if (page.missing !== undefined) continue;
      if (page.pageprops?.wikibase_item) return page.pageprops.wikibase_item;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function datesFromQid(qid: string): Promise<Dates | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json&origin=*`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const j = await res.json();
    const claims = j.entities?.[qid]?.claims;
    const births = (claims?.P569 || [])
      .map((c: any) => toIso(c?.mainsnak?.datavalue?.value?.time))
      .filter(Boolean) as string[];
    births.sort((a, b) => {
      const score = (d: string) => (d.endsWith("-01-01") ? 0 : 2);
      return score(b) - score(a);
    });
    const birthDate = births[0];
    const deathDate = toIso(claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time);
    if (!birthDate) return null;
    return { birthDate, ...(deathDate ? { deathDate } : {}) };
  } catch {
    return null;
  }
}

/** Verified curated dates */
const CURATED: Record<string, Dates> = {
  "yvbl-zmyr": { birthDate: "1963-07-15", deathDate: "2011-12-21" },
  "yuval-hamevulbal": { birthDate: "1972-07-23" },
  "shira-haas": { birthDate: "1995-05-11" },
  "avi-grinik": { birthDate: "1971-11-22" },
  "gvry-alpy": { birthDate: "1976-09-18" },
  "dnh-smv": { birthDate: "1977-09-25" },
  "kobi-likverman": { birthDate: "1974-01-01" }, // approximate if unknown — skip if not verified
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
  // Drop unverified year-only curated for kobi unless we find wiki
  delete CURATED["kobi-likverman"];

  const merged: Record<string, Dates> = { ...PERSON_DATES };
  for (const [id, d] of Object.entries(CURATED)) {
    merged[id] = { ...merged[id], ...d };
  }

  // Fill death dates for people who have birth but may be missing death
  const needBirth = SEED.people.filter((p) => !(p.birthDate || merged[p.id]?.birthDate));
  const needDeath = SEED.people.filter(
    (p) =>
      (p.birthDate || merged[p.id]?.birthDate) &&
      !(p.deathDate || merged[p.id]?.deathDate)
  );

  console.log("Missing birth:", needBirth.length);
  console.log("Have birth, no death (will try wiki):", needDeath.length);

  // SPARQL for missing birth
  const labelToIds = new Map<string, string[]>();
  for (const p of needBirth) {
    for (const label of [cleanLabel(p.name), p.name]) {
      if (!label) continue;
      const list = labelToIds.get(label) || [];
      list.push(p.id);
      labelToIds.set(label, list);
    }
  }
  const labels = [...labelToIds.keys()];
  for (let i = 0; i < labels.length; i += 25) {
    const chunk = labels.slice(i, i + 25);
    console.log(`SPARQL birth chunk ${i / 25 + 1}`);
    const hits = await sparqlBatch(chunk);
    for (const [label, dates] of hits) {
      for (const id of labelToIds.get(label) || []) {
        if (!merged[id]?.birthDate) {
          merged[id] = { ...merged[id], ...dates };
          console.log(`✓ birth ${id}: ${dates.birthDate}`);
        }
      }
    }
    await sleep(900);
  }

  // Wikipedia fallback for still missing birth
  const still = SEED.people.filter((p) => !(p.birthDate || merged[p.id]?.birthDate));
  console.log("Wikipedia fallback:", still.length);
  let i = 0;
  for (const p of still) {
    i++;
    const titles = [cleanLabel(p.name), p.name, ...(p.nicknames || [])];
    let found: Dates | null = null;
    for (const t of [...new Set(titles.filter(Boolean))]) {
      const qid = await qidFromWiki(t);
      await sleep(150);
      if (!qid) continue;
      found = await datesFromQid(qid);
      await sleep(150);
      if (found?.birthDate) break;
    }
    if (found?.birthDate) {
      merged[p.id] = { ...merged[p.id], ...found };
      console.log(`[${i}/${still.length}] ✓ ${p.name}: ${found.birthDate}`);
    } else if (i % 10 === 0) {
      console.log(`[${i}/${still.length}] …`);
    }
  }

  // Death dates for known living-status unknowns — sample notables with wiki pages
  // Only for people already in PERSON_DATES without death, try Wikipedia once
  let deathAdds = 0;
  const deathCandidates = SEED.people
    .filter((p) => merged[p.id]?.birthDate && !merged[p.id]?.deathDate)
    .slice(0, 120); // cap to avoid rate limit
  console.log("Checking death for", deathCandidates.length);
  for (const p of deathCandidates) {
    const qid = await qidFromWiki(p.name);
    await sleep(120);
    if (!qid) continue;
    const d = await datesFromQid(qid);
    await sleep(120);
    if (d?.deathDate) {
      merged[p.id] = { ...merged[p.id], deathDate: d.deathDate };
      if (d.birthDate && (!merged[p.id].birthDate || merged[p.id].birthDate!.endsWith("-01-01"))) {
        merged[p.id].birthDate = d.birthDate;
      }
      deathAdds++;
      console.log(`† ${p.name}: ${d.deathDate}`);
    }
  }
  console.log("Death dates added:", deathAdds);

  fs.writeFileSync(
    path.join(__dirname, "../src/lib/seed-dates.ts"),
    formatSeedDates(merged),
    "utf8"
  );

  const withBirth = SEED.people.filter(
    (p) => p.birthDate || merged[p.id]?.birthDate
  ).length;
  console.log(`Done. withBirth≈${withBirth}/${SEED.people.length}, PERSON_DATES=${Object.keys(merged).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
