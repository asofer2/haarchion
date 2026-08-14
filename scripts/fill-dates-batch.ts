/**
 * Batch-fill missing birth dates via Wikidata SPARQL (by Hebrew/English label).
 * Then Wikipedia→QID fallback for leftovers.
 * Merges into PERSON_DATES without wiping existing entries.
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";

const UA = "IshimArchive/1.0 (educational; batch birth dates)";

type Dates = { birthDate?: string; deathDate?: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toIso(v?: string): string | undefined {
  if (!v) return undefined;
  const m = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const y = Number(m[1]);
  if (y < 1000 || y > 2100) return undefined;
  let mm = m[2]!;
  let dd = m[3]!;
  if (mm === "00") mm = "01";
  if (dd === "00") dd = "01";
  return `${m[1]}-${mm}-${dd}`;
}

async function sparql(query: string): Promise<any> {
  const url =
    "https://query.wikidata.org/sparql?format=json&query=" +
    encodeURIComponent(query);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/sparql-results+json",
          "User-Agent": UA,
        },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      await sleep(1500 * (attempt + 1));
    }
  }
  return null;
}

async function batchByLabels(
  labels: { id: string; label: string; lang: "he" | "en" }[]
): Promise<Record<string, Dates>> {
  const out: Record<string, Dates> = {};
  if (!labels.length) return out;

  // Map label@lang → person ids (multiple people can share a label theoretically)
  const keyOf = (label: string, lang: string) => `${lang}::${label}`;
  const idsByKey = new Map<string, string[]>();
  for (const row of labels) {
    const k = keyOf(row.label, row.lang);
    const list = idsByKey.get(k) || [];
    list.push(row.id);
    idsByKey.set(k, list);
  }

  const values = [...idsByKey.keys()]
    .map((k) => {
      const [lang, ...rest] = k.split("::");
      const label = rest.join("::").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `"${label}"@${lang}`;
    })
    .join(" ");

  const query = `SELECT ?label ?birth ?death WHERE {
    VALUES ?label { ${values} }
    ?item rdfs:label ?label .
    ?item wdt:P31 wd:Q5 .
    OPTIONAL { ?item wdt:P569 ?birth . }
    OPTIONAL { ?item wdt:P570 ?death . }
  }`;

  const j = await sparql(query);
  const bindings = j?.results?.bindings || [];
  for (const b of bindings) {
    const labelVal: string = b.label?.value;
    const lang: string = b.label?.["xml:lang"] || "he";
    if (!labelVal) continue;
    const birthDate = toIso(b.birth?.value);
    const deathDate = toIso(b.death?.value);
    if (!birthDate && !deathDate) continue;
    const ids = idsByKey.get(keyOf(labelVal, lang)) || [];
    for (const id of ids) {
      // Prefer earlier hit with birth
      if (!out[id]?.birthDate) {
        out[id] = {
          ...(birthDate ? { birthDate } : {}),
          ...(deathDate ? { deathDate } : {}),
        };
      }
    }
  }
  return out;
}

async function qidFromWiki(lang: "he" | "en", title: string): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    title
  )}&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&origin=*`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      query?: { pages?: Record<string, { pageprops?: { wikibase_item?: string }; missing?: string }> };
    };
    for (const page of Object.values(j.query?.pages || {})) {
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
    const birthDate = toIso(claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time);
    const deathDate = toIso(claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time);
    if (!birthDate && !deathDate) return null;
    return {
      ...(birthDate ? { birthDate } : {}),
      ...(deathDate ? { deathDate } : {}),
    };
  } catch {
    return null;
  }
}

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

  // Alias fixes for known id mismatches
  const aliases: Record<string, string> = {
    "yuval-hamevulbal": "yuval-hamvulbal-w2",
    "zipi-shavit": "tzipi-shavit",
    "yael-abecassis": "yael-abeccassis",
  };
  for (const [id, from] of Object.entries(aliases)) {
    if (!merged[id]?.birthDate && merged[from]?.birthDate) {
      merged[id] = { ...merged[from] };
    }
  }

  const missing = SEED.people.filter((p) => !(p.birthDate || merged[p.id]?.birthDate));
  console.log(`Missing: ${missing.length}`);

  // —— Phase 1: SPARQL batches by Hebrew name ——
  const labelRows: { id: string; label: string; lang: "he" | "en" }[] = [];
  for (const p of missing) {
    labelRows.push({ id: p.id, label: p.name, lang: "he" });
    if (p.nameOriginal) labelRows.push({ id: p.id, label: p.nameOriginal, lang: "en" });
    for (const n of p.nicknames || []) {
      if (/[\u0590-\u05FF]/.test(n)) labelRows.push({ id: p.id, label: n, lang: "he" });
      else if (/[A-Za-z]/.test(n)) labelRows.push({ id: p.id, label: n, lang: "en" });
    }
  }

  const CHUNK = 40;
  let sparqlHits = 0;
  for (let i = 0; i < labelRows.length; i += CHUNK) {
    const chunk = labelRows.slice(i, i + CHUNK);
    // skip already filled
    const pending = chunk.filter((r) => !merged[r.id]?.birthDate);
    if (!pending.length) continue;
    console.log(`SPARQL batch ${i / CHUNK + 1} (${pending.length} labels)...`);
    const hits = await batchByLabels(pending);
    for (const [id, d] of Object.entries(hits)) {
      if (!merged[id]?.birthDate && d.birthDate) {
        merged[id] = { ...merged[id], ...d };
        sparqlHits++;
        console.log(`  ✓ ${id}: ${d.birthDate}`);
      } else if (d.deathDate && !merged[id]?.deathDate) {
        merged[id] = { ...merged[id], ...d };
      }
    }
    await sleep(800);
  }
  console.log(`SPARQL filled: ${sparqlHits}`);

  // —— Phase 2: Wikipedia page → QID for still missing ——
  const still = SEED.people.filter((p) => !(p.birthDate || merged[p.id]?.birthDate));
  console.log(`Wikipedia fallback for ${still.length}...`);
  let wikiHits = 0;
  let i = 0;
  for (const p of still) {
    i++;
    const titles: { lang: "he" | "en"; title: string }[] = [{ lang: "he", title: p.name }];
    if (p.nameOriginal) titles.push({ lang: "en", title: p.nameOriginal });
    for (const n of p.nicknames || []) {
      titles.push({
        lang: /[A-Za-z]/.test(n) ? "en" : "he",
        title: n,
      });
    }

    let found: Dates | null = null;
    for (const t of titles) {
      const qid = await qidFromWiki(t.lang, t.title);
      await sleep(100);
      if (!qid) continue;
      found = await datesFromQid(qid);
      await sleep(100);
      if (found?.birthDate) break;
    }

    if (found?.birthDate) {
      wikiHits++;
      merged[p.id] = { ...merged[p.id], ...found };
      console.log(`[${i}/${still.length}] ✓ ${p.name}: ${found.birthDate}`);
    } else if (i % 20 === 0) {
      console.log(`[${i}/${still.length}] …`);
    }
  }
  console.log(`Wikipedia filled: ${wikiHits}`);

  fs.writeFileSync(
    path.join(__dirname, "../src/lib/seed-dates.ts"),
    formatSeedDates(merged),
    "utf8"
  );
  fs.writeFileSync(
    path.join(__dirname, "wikidata-dates.json"),
    JSON.stringify(merged, null, 2),
    "utf8"
  );

  // Re-evaluate coverage (without re-importing SEED enrichment — approximate)
  const withBirth = SEED.people.filter(
    (p) => p.birthDate || merged[p.id]?.birthDate
  ).length;
  console.log(
    `\nDone. PERSON_DATES=${Object.keys(merged).length}, approx withBirth=${withBirth}/${SEED.people.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
